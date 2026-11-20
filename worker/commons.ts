// Wikimedia Commons image search + import.
import { commonsKey, type CommonsResult } from "../shared/types";
import type { Env } from "./env";
import { HttpError, IMAGE_TYPE, imageExt, randomId, sha256 } from "./http";
import { WikimediaBusy, WikimediaUnavailable, wikimediaFetch } from "./wikimedia";

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

interface QueryResult {
  pages: ApiPage[];
  /** Requested title → title the API answered for (normalisation, then redirects). */
  aliases: Map<string, string>;
}

async function apiQueryFull(params: Record<string, string>, maxWaitMs?: number): Promise<QueryResult> {
  const url = new URL(API);
  for (const [k, v] of Object.entries({ action: "query", format: "json", formatversion: "2", ...params })) {
    url.searchParams.set(k, v);
  }
  const res = await wikimediaFetch(url, maxWaitMs);
  if (!res.ok) throw new HttpError(502, `Wikimedia error ${res.status}`);
  type Pair = { from: string; to: string };
  const data = (await res.json()) as { query?: { pages?: ApiPage[]; normalized?: Pair[]; redirects?: Pair[] } };
  const aliases = new Map<string, string>();
  for (const { from, to } of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) {
    // Chain: a normalised title may itself be a redirect.
    for (const [k, v] of aliases) if (v === from) aliases.set(k, to);
    aliases.set(from, aliases.get(to) ?? to);
  }
  return { pages: data.query?.pages ?? [], aliases };
}

async function apiQuery(params: Record<string, string>, maxWaitMs?: number): Promise<ApiPage[]> {
  return (await apiQueryFull(params, maxWaitMs)).pages;
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

/** Turn "Wikimedia wants us to wait" into a 503 the client can show. */
function busyToHttp(err: unknown): never {
  if (err instanceof WikimediaBusy) {
    throw new HttpError(503, "Wikimedia is busy right now, please try again in a minute.", {
      code: "wikimedia-busy",
      retryAfter: err.retryAfterSec,
    });
  }
  if (err instanceof WikimediaUnavailable) {
    throw new HttpError(502, "Wikimedia didn't respond, please try again.", { code: "wikimedia-unavailable" });
  }
  throw err;
}

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
  }).catch(busyToHttp);
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
  const pages = await apiQuery({ titles: title, iiurlwidth: DISPLAY_WIDTH, ...IMAGE_PROPS }).catch(busyToHttp);
  const info = pages[0]?.imageinfo?.[0];
  if (!info?.thumburl) throw new HttpError(404, "Image not found on Wikimedia Commons");
  const { body, type } = await downloadImage(info).catch(busyToHttp);
  const imageKey = `img/${randomId(16)}.${imageExt(type)}`;
  await env.IMAGES.put(imageKey, body, { httpMetadata: { contentType: type } });
  return { imageKey, credit: creditFor(info) };
}

export interface BatchResult {
  /** Keyed by commonsKey(title). */
  images: Map<string, { imageKey: string; credit: string }>;
  /**
   * Titles that failed for a temporary reason (throttling, timeouts, network, out of time):
   * trying again later can fetch them. Permanent failures (file gone, unsupported type…) are
   * only logged; retrying can't fix them.
   */
  retryable: string[];
  /** Set when Wikimedia throttled us: roughly how long to wait before retrying. */
  retryAfterSec?: number;
}

/** A pack import gives up on remaining downloads after this long, so the user isn't left hanging. */
const BATCH_BUDGET_MS = 45000;

class OutOfTime extends Error {}

/**
 * Failures a retry can't fix: the file is gone, too large, an unsupported type, or not hosted where
 * we expect. Everything else (throttling, timeouts, 5xx, other odd statuses) is worth retrying.
 */
const PERMANENT_STATUS = new Set([400, 404, 410, 413, 415]);
const isTemporary = (err: unknown) => !(err instanceof HttpError && PERMANENT_STATUS.has(err.status));

const PACK_EXTS = ["jpg", "jpeg", "png", "webp", "gif"] as const;
const FALLBACK_CREDIT = "Wikimedia Commons";

/** R2 key prefix for a pack image; the extension comes from the downloaded file. */
const packKeyPrefix = async (title: string) => `img/pack-${(await sha256(title)).slice(0, 24)}`;

/** An already-stored pack image (and its credit, kept in the object's metadata). */
async function cachedPackImage(env: Env, title: string): Promise<{ imageKey: string; credit?: string } | null> {
  const prefix = await packKeyPrefix(title);
  // The extension depends on what was downloaded; check the candidates in parallel (one round trip).
  const found = await Promise.all(PACK_EXTS.map((ext) => env.IMAGES.head(`${prefix}.${ext}`)));
  const obj = found.find(Boolean);
  return obj ? { imageKey: obj.key, credit: obj.customMetadata?.credit || undefined } : null;
}

/**
 * Import many Commons files at once (used by built-in packs). Uses deterministic R2 keys, so each
 * file is downloaded only once, ever, and stores the credit with the image: pictures that are
 * already stored never need Wikimedia again (a retry, or "use what arrived", works even while
 * Wikimedia is throttling us). Never throws for individual files.
 */
export async function importCommonsBatch(
  env: Env,
  titles: string[],
  { cacheOnly = false }: { cacheOnly?: boolean } = {},
): Promise<BatchResult> {
  const images = new Map<string, { imageKey: string; credit: string }>();
  const temporary = new Set<string>();
  let retryAfterSec: number | undefined;
  const deadline = Date.now() + BATCH_BUDGET_MS;
  const fail = (keys: string[], err: unknown) => {
    if (err instanceof WikimediaBusy) retryAfterSec = Math.max(retryAfterSec ?? 0, err.retryAfterSec);
    if (isTemporary(err)) keys.forEach((k) => temporary.add(k));
    if (!(err instanceof WikimediaBusy || err instanceof OutOfTime)) console.warn("import failed", keys, err);
  };

  // 1. Whatever is already stored, without asking Wikimedia.
  const keys = [...new Set(titles.map(commonsKey))];
  const needApi: string[] = [];
  const cachedNoCredit = new Map<string, string>(); // key → imageKey (stored before credits were kept)
  await mapLimit(keys, 6, async (key) => {
    const hit = await cachedPackImage(env, key).catch(() => null);
    if (hit?.credit) images.set(key, { imageKey: hit.imageKey, credit: hit.credit });
    else {
      if (hit) cachedNoCredit.set(key, hit.imageKey);
      needApi.push(key);
    }
  });

  // 2. The rest from Wikimedia, 40 titles per metadata query (skipped for "use what's stored").
  for (let i = 0; !cacheOnly && i < needApi.length; i += 40) {
    const chunk = needApi.slice(i, i + 40);
    let result: QueryResult;
    try {
      const left = deadline - Date.now();
      if (left <= 0 || retryAfterSec !== undefined) throw new OutOfTime();
      result = await apiQueryFull({ titles: chunk.join("|"), redirects: "1", iiurlwidth: DISPLAY_WIDTH, ...IMAGE_PROPS }, left);
    } catch (err) {
      fail(chunk.filter((k) => !cachedNoCredit.has(k)), err);
      continue;
    }
    // Map the API's (normalised / redirected) titles back to the titles we asked for.
    const askedFor = new Map<string, string[]>();
    for (const key of chunk) {
      const answered = commonsKey(result.aliases.get(key) ?? key);
      askedFor.set(answered, [...(askedFor.get(answered) ?? []), key]);
    }
    await mapLimit(result.pages, 3, async (page) => {
      const asked = askedFor.get(commonsKey(page.title)) ?? [];
      if (asked.length === 0) return;
      try {
        const info = page.imageinfo?.[0];
        if (!info?.thumburl) throw new HttpError(404, "File not found on Commons");
        const credit = creditFor(info);
        const stored = asked.map((k) => cachedNoCredit.get(k)).find(Boolean);
        let imageKey: string;
        if (stored) {
          imageKey = stored; // already downloaded earlier; only the credit was missing
          await rememberCredit(env, imageKey, credit).catch((err) => console.warn("credit update failed", err));
        } else {
          const left = deadline - Date.now();
          // Out of time, or Wikimedia already told us to back off: leave it for a retry.
          if (left <= 0 || retryAfterSec !== undefined) throw new OutOfTime();
          const { body, type } = await downloadImage(info, left);
          // Store under every requested title (several can redirect to the same file), so each of
          // them is found in the cache next time.
          const keysToStore = await Promise.all(asked.map(async (k) => `${await packKeyPrefix(k)}.${imageExt(type)}`));
          for (const k of keysToStore) {
            await env.IMAGES.put(k, body, { httpMetadata: { contentType: type }, customMetadata: { credit } });
          }
          imageKey = keysToStore[0];
        }
        for (const k of asked) images.set(k, { imageKey, credit });
      } catch (err) {
        fail(asked, err);
      }
    });
    // Titles the API didn't answer for at all are permanent misses (nothing to retry).
  }
  // Images stored earlier whose credit lookup was skipped or failed are still usable.
  for (const [key, imageKey] of cachedNoCredit) if (!images.has(key)) images.set(key, { imageKey, credit: FALLBACK_CREDIT });

  return { images, retryable: [...temporary].filter((k) => !images.has(k)), retryAfterSec };
}

/** Rewrite an older stored image with its credit in the metadata (R2 can't edit metadata in place). */
async function rememberCredit(env: Env, imageKey: string, credit: string) {
  const obj = await env.IMAGES.get(imageKey);
  if (!obj) return;
  await env.IMAGES.put(imageKey, await obj.arrayBuffer(), { httpMetadata: obj.httpMetadata, customMetadata: { credit } });
}

/** Run `fn` over `items` with at most `limit` at a time. `fn` must not throw. */
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** Widths Wikimedia pre-renders thumbnails at (other widths get snapped or rate-limited). */
const THUMB_STEPS = [250, 330, 500, 960, 1280];

/**
 * When a file is no wider than the requested width, Commons hands back the *original* file URL
 * instead of a thumbnail. Wikimedia rate-limits automated downloads of originals much harder
 * (server-side fetches get 429 with retry-after: 600), so ask for a real thumbnail one standard
 * step smaller instead. Thumbnail URLs are returned unchanged.
 */
export function scaledThumbUrl(info: ImageInfo): string | undefined {
  if (!info.thumburl) return undefined;
  const url = new URL(info.thumburl);
  if (url.pathname.includes("/thumb/")) return info.thumburl;
  // Only plain raster originals: other formats (TIFF, PDF…) name their thumbnails differently, and
  // Commons always hands those out as /thumb/ URLs anyway.
  const m = url.pathname.match(/^(\/wikipedia\/[^/]+)\/([0-9a-f]\/[0-9a-f]{2})\/([^/]+\.(?:jpe?g|png|gif|webp))$/i);
  const width = THUMB_STEPS.filter((w) => w < (info.thumbwidth ?? 0)).pop();
  if (!m || !width) return info.thumburl; // unexpected layout or tiny image: use as is
  const name = m[3];
  // MediaWiki names thumbnails of file names over 160 bytes "<w>px-thumbnail.<ext>"
  // (checked against Commons: a 217-byte name gives "330px-thumbnail.jpg").
  const long = new TextEncoder().encode(decodeURIComponent(name)).length > 160;
  const thumbName = long ? `thumbnail${name.slice(name.lastIndexOf("."))}` : name;
  return `${url.origin}${m[1]}/thumb/${m[2]}/${name}/${width}px-${thumbName}`;
}

/** Download a Wikimedia thumbnail, refusing hosts other than Wikimedia's upload servers. */
async function downloadThumb(thumbUrl: string, maxWaitMs?: number): Promise<{ body: ArrayBuffer; type: string }> {
  const thumb = new URL(thumbUrl);
  if (!IMAGE_HOSTS.has(thumb.hostname)) throw new HttpError(400, "Unexpected image host");
  const res = await wikimediaFetch(thumb, maxWaitMs);
  if (res.status === 404 || res.status === 410) throw new HttpError(404, "Image no longer on Wikimedia");
  if (!res.ok) throw new HttpError(502, `Could not download image (${res.status})`);
  const type = imageType(res);
  return { body: await res.arrayBuffer(), type };
}

/** Download a Commons image at display size (a real thumbnail, see scaledThumbUrl). */
function downloadImage(info: ImageInfo, maxWaitMs?: number): Promise<{ body: ArrayBuffer; type: string }> {
  const url = scaledThumbUrl(info);
  if (!url) throw new HttpError(404, "Image not found on Wikimedia Commons");
  return downloadThumb(url, maxWaitMs);
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
