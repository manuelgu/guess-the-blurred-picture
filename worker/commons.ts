// Wikimedia Commons image search + import.
import type { CommonsResult } from "../shared/types";
import type { Env } from "./env";
import { HttpError, IMAGE_TYPE, UA, imageExt, randomId, sha256 } from "./http";

const API = "https://commons.wikimedia.org/w/api.php";
const IMAGE_HOSTS = new Set(["upload.wikimedia.org", "thumb.wikimedia.org"]);
// Wikimedia snaps thumbnails to standard widths; 1280 is plenty for a TV.
const DISPLAY_WIDTH = "1280";

interface ImageInfo {
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  mime?: string;
  extmetadata?: Record<string, { value?: string }>;
}

interface ApiPage {
  title: string;
  index?: number;
  imageinfo?: ImageInfo[];
}

async function apiQuery(params: Record<string, string>): Promise<ApiPage[]> {
  const url = new URL(API);
  for (const [k, v] of Object.entries({ action: "query", format: "json", formatversion: "2", ...params })) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new HttpError(502, `Wikimedia error ${res.status}`);
  const data = (await res.json()) as { query?: { pages?: ApiPage[] } };
  return data.query?.pages ?? [];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // Last, so an escaped entity like "&amp;lt;" decodes to "&lt;", not "<".
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function creditFor(info: ImageInfo): string {
  const meta = info.extmetadata ?? {};
  const artist = stripHtml(meta.Artist?.value ?? "").slice(0, 120);
  const license = stripHtml(meta.LicenseShortName?.value ?? "");
  return [artist, license, "Wikimedia Commons"].filter(Boolean).join(" · ");
}

/** "File:Albert Einstein Head.jpg" → "Albert Einstein Head" */
function suggestedAnswer(title: string): string {
  return title
    .replace(/^File:/, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const IMAGE_PROPS = {
  prop: "imageinfo",
  iiprop: "url|mime|extmetadata",
  iiextmetadatafilter: "Artist|LicenseShortName",
};

export async function searchCommons(query: string, offset = 0): Promise<CommonsResult[]> {
  if (!query.trim()) return [];
  const pages = await apiQuery({
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "30",
    gsroffset: String(offset),
    iiurlwidth: "400",
    ...IMAGE_PROPS,
  });
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .flatMap((p) => {
      const info = p.imageinfo?.[0];
      if (!info?.thumburl || !IMAGE_TYPE.test(info.mime ?? "")) return [];
      return [
        {
          title: p.title,
          thumbUrl: info.thumburl,
          width: info.thumbwidth ?? 0,
          height: info.thumbheight ?? 0,
          suggestedAnswer: suggestedAnswer(p.title),
          credit: creditFor(info),
        },
      ];
    });
}

/** Fetch a Commons file at display resolution and store it in R2. */
export async function importFromCommons(env: Env, title: string): Promise<{ imageKey: string; credit: string }> {
  if (!/^File:.+/.test(title)) throw new HttpError(400, "Bad file title");
  const pages = await apiQuery({ titles: title, iiurlwidth: DISPLAY_WIDTH, ...IMAGE_PROPS });
  const info = pages[0]?.imageinfo?.[0];
  if (!info?.thumburl) throw new HttpError(404, "Image not found on Wikimedia Commons");
  const res = await downloadThumb(info.thumburl);
  const type = imageType(res);
  const imageKey = `img/${randomId(16)}.${imageExt(type)}`;
  await env.IMAGES.put(imageKey, res.body, { httpMetadata: { contentType: type } });
  return { imageKey, credit: creditFor(info) };
}

/**
 * Import many Commons files at once (used by built-in packs). Uses deterministic R2 keys
 * so each file is downloaded only once, ever. Files that fail are left out.
 */
export async function importCommonsBatch(
  env: Env,
  titles: string[],
): Promise<Map<string, { imageKey: string; credit: string }>> {
  const out = new Map<string, { imageKey: string; credit: string }>();
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40);
    const pages = await apiQuery({ titles: chunk.join("|"), iiurlwidth: DISPLAY_WIDTH, ...IMAGE_PROPS });
    await mapLimit(pages, 6, async (page) => {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl) return;
      const ext = (new URL(info.thumburl).pathname.match(/\.(jpe?g|png|webp)$/i)?.[1] ?? "jpg").toLowerCase();
      const imageKey = `img/pack-${(await sha256(page.title)).slice(0, 24)}.${ext}`;
      if (!(await env.IMAGES.head(imageKey))) {
        const res = await downloadThumb(info.thumburl);
        const type = imageType(res);
        await env.IMAGES.put(imageKey, res.body, { httpMetadata: { contentType: type } });
      }
      out.set(page.title, { imageKey, credit: creditFor(info) });
    });
  }
  return out;
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      await fn(item).catch((err) => console.warn("import failed", err));
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** Download a Wikimedia thumbnail, refusing hosts other than Wikimedia's upload servers. */
async function downloadThumb(thumbUrl: string): Promise<Response & { body: ReadableStream }> {
  const thumb = new URL(thumbUrl);
  if (!IMAGE_HOSTS.has(thumb.hostname)) throw new HttpError(400, "Unexpected image host");
  const res = await fetchImage(thumb);
  if (!res.ok || !res.body) {
    await res.body?.cancel();
    throw new HttpError(502, `Could not download image (${res.status})`);
  }
  return res as Response & { body: ReadableStream };
}

/**
 * Content type of a downloaded image. Images are re-served from our own origin, so only raster
 * types we expect are accepted; anything else is refused (and its body released).
 */
function imageType(res: Response): string {
  const type = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim().toLowerCase();
  if (!IMAGE_TYPE.test(type)) {
    res.body?.cancel().catch(() => {});
    throw new HttpError(415, "Unsupported image type");
  }
  return type;
}

/** Wikimedia throttles bursts of thumbnail requests; retry 429/5xx with backoff. */
async function fetchImage(url: URL): Promise<Response> {
  let res: Response | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (res) {
      await res.body?.cancel(); // release the failed attempt's connection before waiting to retry
      await new Promise((r) => setTimeout(r, 800 * 2 ** (attempt - 1)));
    }
    res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok || (res.status !== 429 && res.status < 500)) return res;
  }
  return res!;
}
