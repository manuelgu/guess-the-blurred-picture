// Validates packs/*.json and uploads them to R2 as one bundle, which the Worker reads at runtime.
// Changing a pack therefore needs no Worker deploy, so games in progress are never interrupted.
//
//   node scripts/sync-packs.ts --check             validate only (CI on pull requests)
//   node scripts/sync-packs.ts --local             upload to local dev R2 (runs before `npm run dev`)
//   node scripts/sync-packs.ts --remote            upload to production R2
//   add --commons to also check with Wikimedia Commons that every file exists
//
// The bundle is a single object, so an update is all-or-nothing and a pack deleted from git is
// gone after the next sync; there are no per-pack objects to clean up.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PACK_BUNDLE_KEY, PACK_BUNDLE_VERSION, validatePack, type Pack, type PackBundle } from "../shared/packs.ts";
import { WIKIMEDIA_CLIENT } from "../shared/types.ts";

const ROOT = join(import.meta.dirname, "..");
const PACKS_DIR = join(ROOT, "packs");
const ORDER_FILE = "order.json";

const args = new Set(process.argv.slice(2));
const known = new Set(["--check", "--local", "--remote", "--commons"]);
for (const a of args) if (!known.has(a)) fail(`Unknown option ${a}`);
const targets = ["--check", "--local", "--remote"].filter((a) => args.has(a));
if (targets.length !== 1) fail("Pass exactly one of --check, --local or --remote.");
const target = targets[0];

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// GitHub Actions turns "::error::" lines into annotations on the commit.
const ci = !!process.env.GITHUB_ACTIONS;
const report = (level: "error" | "warning", msg: string) =>
  console[level === "error" ? "error" : "warn"](ci ? `::${level}::${msg}` : `${level === "error" ? "✗" : "!"} ${msg}`);

// ---------- 1. Read and validate ----------

const errors: string[] = [];
const packs = new Map<string, Pack>();

const files = readdirSync(PACKS_DIR)
  .filter((f) => f.endsWith(".json") && f !== ORDER_FILE)
  .sort();
for (const file of files) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(PACKS_DIR, file), "utf8"));
  } catch (err) {
    errors.push(`packs/${file}: not valid JSON (${(err as Error).message})`);
    continue;
  }
  const result = validatePack(raw);
  if (result.errors) {
    for (const e of result.errors) errors.push(`packs/${file}: ${e}`);
    continue;
  }
  if (`${result.pack.id}.json` !== file) {
    errors.push(`packs/${file}: file name must be "${result.pack.id}.json" (the pack's id)`);
    continue;
  }
  packs.set(result.pack.id, result.pack);
}
for (const f of readdirSync(PACKS_DIR)) {
  if (!f.endsWith(".json")) report("warning", `packs/${f}: ignored (not a .json file)`);
}

// Display order: order.json first, then any packs it doesn't list, alphabetically.
let order: string[] = [];
try {
  const parsed: unknown = JSON.parse(readFileSync(join(PACKS_DIR, ORDER_FILE), "utf8"));
  if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === "string")) {
    errors.push(`packs/${ORDER_FILE}: must be an array of pack ids`);
  } else {
    order = parsed;
  }
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") errors.push(`packs/${ORDER_FILE}: ${(err as Error).message}`);
}
const seenInOrder = new Set<string>();
for (const id of order) {
  if (seenInOrder.has(id)) errors.push(`packs/${ORDER_FILE}: "${id}" is listed twice`);
  seenInOrder.add(id);
  // Only report ids whose file is missing, not ones whose file failed validation (already reported).
  if (!packs.has(id) && !files.includes(`${id}.json`)) errors.push(`packs/${ORDER_FILE}: no pack file packs/${id}.json`);
}
const unlisted = [...packs.keys()].filter((id) => !seenInOrder.has(id));
if (unlisted.length > 0 && order.length > 0) {
  report("warning", `not in packs/${ORDER_FILE}, shown last: ${unlisted.join(", ")}`);
}
const ordered = [...order.filter((id) => packs.has(id)), ...unlisted].map((id) => packs.get(id)!);

if (ordered.length === 0 && errors.length === 0) errors.push("no packs found in packs/");

// ---------- 2. Optionally: do the files exist on Commons? ----------

if (args.has("--commons") && errors.length === 0) {
  const missing = await missingOnCommons(ordered);
  for (const { pack, file } of missing) {
    const msg = `packs/${pack}.json: "${file}" does not exist on Wikimedia Commons`;
    // On a pull request this blocks the merge. On upload it only warns: the Worker skips missing
    // pictures anyway, and a file Commons deleted from one pack must not block every other pack change.
    if (target === "--check") errors.push(msg);
    else report("warning", `${msg} (the pack is uploaded without it)`);
  }
}

if (errors.length > 0) {
  for (const e of errors) report("error", e);
  fail(`${errors.length} problem${errors.length === 1 ? "" : "s"}; nothing was uploaded.`);
}

const pictureCount = ordered.reduce((n, p) => n + p.pictures.length, 0);
console.log(`✓ ${ordered.length} packs, ${pictureCount} pictures: ${ordered.map((p) => p.id).join(", ")}`);
if (target === "--check") process.exit(0);

// ---------- 3. Upload ----------

const bundle: PackBundle = {
  version: PACK_BUNDLE_VERSION,
  commit: gitCommit(),
  builtAt: new Date().toISOString(),
  packs: ordered,
};

const bucket = bucketName();
// `npm run dev` syncs every time; skip the (slow) wrangler call when local R2 already has these packs.
// The stamp lives inside the local R2 data, so resetting that data (or all of .wrangler) invalidates it.
// builtAt/commit are left out of the hash so an unchanged pack set really counts as unchanged.
const LOCAL_R2_DIR = join(ROOT, ".wrangler", "state", "v3", "r2");
const LOCAL_STAMP = join(LOCAL_R2_DIR, "packs-local.sha256");
const contentHash = createHash("sha256").update(JSON.stringify([bucket, PACK_BUNDLE_KEY, ordered])).digest("hex");
if (target === "--local") {
  let stamp = "";
  try {
    stamp = readFileSync(LOCAL_STAMP, "utf8");
  } catch {}
  if (stamp === contentHash) {
    console.log("✓ Local R2 already up to date.");
    process.exit(0);
  }
}
const dir = mkdtempSync(join(tmpdir(), "packs-"));
try {
  const file = join(dir, "bundle.json");
  writeFileSync(file, JSON.stringify(bundle));
  // Wrangler's JS entry run by this same Node: no shell, so paths with spaces work on every OS.
  const wrangler = join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
  const res = spawnSync(
    process.execPath,
    [wrangler, "r2", "object", "put", `${bucket}/${PACK_BUNDLE_KEY}`, "--file", file, "--content-type", "application/json", target],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (res.error) fail(`Could not run wrangler: ${res.error.message}`);
  if (res.status !== 0) fail(`wrangler exited with ${res.status}; the packs were not updated.`);
  if (target === "--local") {
    mkdirSync(LOCAL_R2_DIR, { recursive: true });
    writeFileSync(LOCAL_STAMP, contentHash);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(
  `✓ Uploaded to ${target === "--remote" ? "production" : "local"} R2 (${bucket}/${PACK_BUNDLE_KEY}). ` +
    (target === "--remote" ? "Live within about a minute." : ""),
);

// ---------- helpers ----------

function gitCommit(): string | undefined {
  // HEAD, not GITHUB_SHA: CI checks out the tip of main, which can be newer than the triggering commit.
  const res = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  if (res.status !== 0) return process.env.GITHUB_SHA;
  const dirty = spawnSync("git", ["status", "--porcelain", "--", "packs"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  return res.stdout.trim() + (dirty ? "-dirty" : "");
}

/** The R2 bucket bound as IMAGES in wrangler.jsonc, so the name lives in one place. */
function bucketName(): string {
  const config = readFileSync(join(ROOT, "wrangler.jsonc"), "utf8");
  // The r2_buckets entry (a flat object) with binding IMAGES, whatever the key order.
  for (const [entry] of config.matchAll(/\{[^{}]*\}/g)) {
    if (!/"binding"\s*:\s*"IMAGES"/.test(entry)) continue;
    const name = /"bucket_name"\s*:\s*"([^"]+)"/.exec(entry);
    if (name) return name[1];
  }
  fail(`Could not find the IMAGES bucket in wrangler.jsonc`);
}

/**
 * Files Commons says don't exist (following renames/redirects, like the Worker's import does).
 * Network trouble only warns: a Wikimedia outage shouldn't block a pack update.
 */
async function missingOnCommons(list: Pack[]): Promise<{ pack: string; file: string }[]> {
  const wanted = list.flatMap((p) => p.pictures.map((pic) => ({ pack: p.id, file: pic.file })));
  const titles = [...new Set(wanted.map((w) => w.file))];
  const missingTitles = new Set<string>();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const url =
      "https://commons.wikimedia.org/w/api.php?" +
      new URLSearchParams({ action: "query", format: "json", formatversion: "2", redirects: "1", titles: chunk.join("|") });
    let data: {
      error?: { code?: string; info?: string };
      query?: {
        normalized?: { from: string; to: string }[];
        redirects?: { from: string; to: string }[];
        pages?: { title: string; missing?: boolean; invalid?: boolean }[];
      };
    };
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": `${WIKIMEDIA_CLIENT} sync-packs` },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = (await res.json()) as typeof data;
      // The API reports some failures (maxlag, ratelimited…) with status 200 and an error body.
      if (data.error) throw new Error(`${data.error.code}: ${data.error.info}`);
      if (!data.query?.pages) throw new Error("unexpected response");
    } catch (err) {
      // Keep what earlier chunks found; only the unchecked rest is skipped.
      report("warning", `Could not check ${titles.length - i} files on Commons (${(err as Error).message}); not checking those.`);
      break;
    }
    const q = data.query ?? {};
    const follow = (t: string) => {
      t = q.normalized?.find((n) => n.from === t)?.to ?? t;
      // Redirects can chain (a file renamed twice); the cap guards against a loop.
      for (let hops = 0; hops < 5; hops++) {
        const next = q.redirects?.find((r) => r.from === t)?.to;
        if (!next) break;
        t = next;
      }
      return t;
    };
    const bad = new Set((q.pages ?? []).filter((p) => p.missing || p.invalid).map((p) => p.title));
    for (const t of chunk) if (bad.has(follow(t))) missingTitles.add(t);
  }
  return wanted.filter((w) => missingTitles.has(w.file));
}
