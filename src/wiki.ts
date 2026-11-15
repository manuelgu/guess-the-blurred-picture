// Short Wikipedia summaries for the TV, fetched straight from Wikipedia (it allows cross-origin requests).
import { useEffect, useState } from "react";
import { WIKIMEDIA_CLIENT, WIKI_REF } from "../shared/types";

export interface WikiSummary {
  title: string;
  extract: string;
  lang: string;
}

/** Browsers can't set User-Agent; Wikimedia asks browser clients to identify via this header instead. */
const HEADERS = { "Api-User-Agent": WIKIMEDIA_CLIENT };

const cache = new Map<string, Promise<WikiSummary | null>>();

/** Result of one request. `temporary` failures (network, 5xx, 429) shouldn't be cached. */
type Got<T> = { data: T | null; temporary: boolean };

async function getJson<T>(url: string): Promise<Got<T>> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return { data: (await res.json()) as T, temporary: false };
    return { data: null, temporary: res.status === 429 || res.status >= 500 };
  } catch {
    return { data: null, temporary: true };
  }
}

/** Title of the same article in another language, via Wikipedia's interlanguage links. */
async function translatedTitle(lang: string, title: string, target: string): Promise<Got<string>> {
  const q = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    redirects: "1",
    prop: "langlinks",
    lllang: target,
    titles: title,
  });
  const r = await getJson<{ query?: { pages?: { langlinks?: { title: string }[] }[] } }>(
    `https://${lang}.wikipedia.org/w/api.php?${q}`,
  );
  return { data: r.data?.query?.pages?.[0]?.langlinks?.[0]?.title ?? null, temporary: r.temporary };
}

async function summary(lang: string, title: string): Promise<Got<WikiSummary>> {
  const r = await getJson<{ type?: string; title?: string; extract?: string }>(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  );
  const d = r.data;
  if (!d?.extract || d.type === "disambiguation") return { data: null, temporary: r.temporary };
  return { data: { title: d.title ?? title, extract: d.extract, lang }, temporary: false };
}

/** Summary for "sv:Karlatornet", preferably in `uiLang`, falling back to the article's own language. */
export function fetchWikiSummary(ref: string, uiLang: string): Promise<WikiSummary | null> {
  const key = `${ref}|${uiLang}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let temporary = false;
  const p = (async () => {
    const m = WIKI_REF.exec(ref);
    if (!m) return null;
    const [, lang, title] = m;
    if (lang !== uiLang) {
      const other = await translatedTitle(lang, title, uiLang);
      temporary ||= other.temporary;
      if (other.data) {
        const s = await summary(uiLang, other.data);
        temporary ||= s.temporary;
        if (s.data) return s.data;
      }
    }
    const s = await summary(lang, title);
    temporary ||= s.temporary;
    return s.data;
  })();
  cache.set(key, p);
  // Keep definitive answers, including "no summary" (missing article, disambiguation page). After a
  // hiccup (e.g. the translation lookup failed and we fell back to the original language), show
  // what we have now but ask again next time.
  p.then(() => temporary && cache.delete(key));
  return p;
}

export function useWikiSummary(ref: string | null, uiLang: string): WikiSummary | null {
  const [result, setResult] = useState<{ key: string; s: WikiSummary | null } | null>(null);
  const key = ref ? `${ref}|${uiLang}` : "";
  useEffect(() => {
    if (!ref) return;
    let live = true;
    fetchWikiSummary(ref, uiLang).then((s) => live && setResult({ key: `${ref}|${uiLang}`, s }));
    return () => {
      live = false;
    };
  }, [ref, uiLang]);
  return result && result.key === key ? result.s : null;
}
