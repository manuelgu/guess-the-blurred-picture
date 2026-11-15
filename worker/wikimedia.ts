// Polite HTTP client for Wikimedia (API + upload servers).
//
// Wikimedia's rules (https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits):
// - identified clients (User-Agent with contact info) get 200 requests/min; unidentified ones 10,
// - keep 3 or fewer requests in flight,
// - on 429/503 honour Retry-After, otherwise back off at least 5 s (exponentially).
//
// Concurrency is limited by the callers (a pack import downloads 3 at a time). The only state shared
// between requests in an isolate is plain data (timestamps): Workers can't safely let one request
// wake another's promise, and a cancelled request (closed tab) must not be able to leak anything.
// So this is a best effort per isolate, which is enough to stay well below Wikimedia's limits.

import { HttpError, UA } from "./http";

const MAX_PER_MINUTE = 150; // headroom below the 200/min identified-client limit
const MAX_ATTEMPTS = 4;
const MIN_BACKOFF_MS = 5000;
/** A single request (headers and body) may take this long before it's aborted. */
const REQUEST_TIMEOUT_MS = 20000;
/** Responses are read fully (bounded by the timeout); refuse anything bigger than this. */
const MAX_BODY_BYTES = 15 * 1024 * 1024;
/** Never keep a user's request waiting longer than this for a single retry. */
const DEFAULT_MAX_WAIT_MS = 20000;

/** Wikimedia throttled us (429/503) and wants us to wait longer than the caller can. */
export class WikimediaBusy extends Error {
  constructor(public retryAfterSec: number) {
    super(`Wikimedia is rate limiting us, retry in ${retryAfterSec}s`);
  }
}

/** A temporary failure that isn't throttling: timeouts, network errors, 5xx, or running out of time. */
export class WikimediaUnavailable extends Error {}

/** Start times of recent requests, for the per-minute budget (shared, plain data). */
const recent: number[] = [];
/**
 * Per host: no request starts before this (set from a throttled response). Separate per host, so
 * the upload servers throttling image downloads doesn't block the search/metadata API.
 */
const cooldownUntil = new Map<string, number>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const secs = (ms: number) => Math.max(1, Math.ceil(ms / 1000));

/** Wait (in this request) until we may send to `host`, or throw if that's past `deadline`. */
async function mayStart(host: string, deadline: number): Promise<void> {
  for (;;) {
    const now = Date.now();
    const cool = cooldownUntil.get(host) ?? 0;
    if (cool > now) {
      if (cool > deadline) throw new WikimediaBusy(secs(cool - now));
      await sleep(cool - now);
      continue;
    }
    while (recent.length && recent[0] <= now - 60000) recent.shift();
    if (recent.length >= MAX_PER_MINUTE) {
      const free = recent[0] + 60000;
      if (free > deadline) throw new WikimediaBusy(secs(free - now));
      await sleep(free - now);
      continue;
    }
    recent.push(now);
    return;
  }
}

/** Milliseconds from a Retry-After header (delta-seconds or HTTP date), if present. */
function retryAfterMs(res: Response): number | null {
  const v = res.headers.get("retry-after");
  if (!v) return null;
  const n = Number(v);
  if (Number.isFinite(n)) return Math.max(0, n * 1000);
  const at = Date.parse(v);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null;
}

/** The whole response, read within the request timeout. */
async function readAll(res: Response): Promise<Response> {
  // Too large is permanent (HttpError): retrying would just download it again.
  if (Number(res.headers.get("content-length")) > MAX_BODY_BYTES) {
    await res.body?.cancel().catch(() => {});
    throw new HttpError(413, "Response too large");
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BODY_BYTES) throw new HttpError(413, "Response too large");
  return new Response(buf, { status: res.status, statusText: res.statusText, headers: res.headers });
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/**
 * fetch() for Wikimedia with our User-Agent, a timeout and retries.
 * Returns the final response (fully downloaded), which may be a non-retryable error such as 404.
 * Throws WikimediaBusy when Wikimedia throttles us for longer than `maxWaitMs`, and
 * WikimediaUnavailable for other temporary failures (timeouts, network errors, 5xx, no time left).
 */
export async function wikimediaFetch(url: URL | string, maxWaitMs = DEFAULT_MAX_WAIT_MS): Promise<Response> {
  const host = new URL(url).hostname;
  const deadline = Date.now() + maxWaitMs;
  for (let attempt = 0; ; attempt++) {
    await mayStart(host, deadline);
    let res: Response | null = null;
    try {
      // Never outlive the caller's deadline (e.g. a pack import's overall time budget).
      const timeout = Math.max(1000, Math.min(REQUEST_TIMEOUT_MS, deadline - Date.now()));
      const fetched = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(timeout) });
      if (!RETRYABLE.has(fetched.status)) return await readAll(fetched);
      res = fetched;
      await fetched.body?.cancel().catch(() => {}); // free the connection before waiting
    } catch (err) {
      if (err instanceof HttpError) throw err; // permanent (e.g. too large): don't retry
      // network error or timeout: retried below
    }

    // Throttling = 429, or a 503 that explicitly asks us to wait. A bare 503 is just a server hiccup
    // (e.g. a thumbnail failing to render): retry that file, but don't pause everything else.
    const throttled = !!res && (res.status === 429 || (res.status === 503 && res.headers.has("retry-after")));
    // Wikimedia: honour Retry-After, otherwise back off at least 5 s (exponentially). A tiny or
    // zero Retry-After never makes us retry faster than that.
    const wait = Math.max(MIN_BACKOFF_MS * 2 ** attempt, (res && retryAfterMs(res)) ?? 0);
    const last = attempt + 1 >= MAX_ATTEMPTS;
    if (throttled) {
      // Every request to this host (in this isolate) backs off, not just this one.
      cooldownUntil.set(host, Math.max(cooldownUntil.get(host) ?? 0, Date.now() + wait));
      if (last || Date.now() + wait > deadline) throw new WikimediaBusy(secs(wait));
      continue; // mayStart() does the waiting
    }
    if (last || Date.now() + wait > deadline) {
      throw new WikimediaUnavailable(res ? `Wikimedia error ${res.status}` : "Could not reach Wikimedia");
    }
    await sleep(wait);
  }
}
