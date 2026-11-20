// Built-in packs. The pack data lives in `packs/*.json` in the repo; scripts/sync-packs.ts validates
// it and uploads one bundle to R2 (no Worker deploy, so games in progress are never interrupted).
// Images are Wikipedia lead images on Wikimedia Commons, imported into R2 when a pack is used.

import { PACK_BUNDLE_KEY, PACK_BUNDLE_VERSION, PACK_ID, validatePack, type Pack } from "../shared/packs";
import type { Env } from "./env";

export type { Pack };

/** How long an isolate trusts its copy before asking R2 again (a new pack shows up within this). */
const FRESH_MS = 60_000;
/** After a failed or empty R2 read, try again this soon. */
const RETRY_MS = 10_000;

// Plain data only: a Promise or stream shared across requests is not allowed in Workers.
let cache: { packs: Pack[]; etag: string | null; uploaded: number; checkedAt: number } | null = null;

/** The current packs, in display order. An empty list when nothing has been synced yet. */
export async function loadPacks(env: Env, maxAgeMs = FRESH_MS): Promise<Pack[]> {
  const now = Date.now();
  if (cache && now - cache.checkedAt < maxAgeMs) return cache.packs;
  try {
    // Unchanged bundle → R2 answers without a body and we keep the parsed copy.
    const obj = await env.IMAGES.get(
      PACK_BUNDLE_KEY,
      cache?.etag ? { onlyIf: { etagDoesNotMatch: cache.etag } } : undefined,
    );
    if (!obj) {
      // Not an expected state in production (CI uploads the bundle): say so, and look again soon.
      console.error(`No pack bundle at ${PACK_BUNDLE_KEY}; run \`npm run sync-packs -- --remote\``);
      // Keep any packs we already had (a bundle never disappears on purpose).
      cache = { packs: cache?.packs ?? [], etag: null, uploaded: 0, checkedAt: now - FRESH_MS + RETRY_MS };
    } else if (!("body" in obj)) {
      cache = { ...cache!, checkedAt: now };
    } else {
      const text = await obj.text();
      const uploaded = obj.uploaded.getTime();
      // Concurrent refreshes can finish out of order: never replace a newer bundle with an older one.
      if (cache && cache.uploaded > uploaded) return cache.packs;
      // An unreadable bundle keeps the packs we had (remembering its etag, so it isn't re-parsed every time).
      const packs = parseBundle(text) ?? cache?.packs ?? [];
      cache = { packs, etag: obj.etag, uploaded, checkedAt: now };
    }
    return cache.packs;
  } catch (err) {
    console.error("Loading packs failed", err);
    if (!cache) throw err;
    // Serve what we have; retry soon rather than after a full FRESH_MS.
    cache = { ...cache, checkedAt: now - FRESH_MS + RETRY_MS };
    return cache.packs;
  }
}

/** A pack not in our copy may be brand new: another isolate may already have listed it. */
const MISS_REFRESH_MS = 5_000;

export async function findPack(env: Env, id: string): Promise<Pack | undefined> {
  if (!PACK_ID.test(id)) return undefined;
  const pack = (await loadPacks(env)).find((p) => p.id === id);
  // On a miss, look again unless our copy is very recent (a cheap conditional read when unchanged).
  return pack ?? (await loadPacks(env, MISS_REFRESH_MS)).find((p) => p.id === id);
}

/**
 * The sync script only uploads valid bundles, but the Worker checks again: a hand-edited object
 * or a bundle from a newer format must not break the home page. Bad packs are skipped, not fatal;
 * an unreadable bundle returns null.
 */
function parseBundle(text: string): Pack[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Pack bundle is not valid JSON");
    return null;
  }
  const bundle = data as { version?: unknown; packs?: unknown };
  if (bundle?.version !== PACK_BUNDLE_VERSION || !Array.isArray(bundle.packs)) {
    console.error(`Unsupported pack bundle (version ${String(bundle?.version)})`);
    return null;
  }
  const packs: Pack[] = [];
  const seen = new Set<string>();
  for (const raw of bundle.packs) {
    const result = validatePack(raw, { lenient: true });
    if (result.errors) {
      console.error(`Skipping invalid pack ${JSON.stringify((raw as { id?: unknown })?.id)}: ${result.errors.join("; ")}`);
    } else if (seen.has(result.pack.id)) {
      console.error(`Skipping duplicate pack "${result.pack.id}"`);
    } else {
      seen.add(result.pack.id);
      packs.push(result.pack);
    }
  }
  return packs;
}
