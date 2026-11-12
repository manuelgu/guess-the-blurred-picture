import { MAX_DECK_PICTURES, REVEAL_MODES, type Deck, type Picture, type RevealModeSetting } from "../shared/types";
import type { Env } from "./env";
import { HttpError, randomId, sha256 } from "./http";

let schemaReady = false;

async function ensureSchema(env: Env) {
  if (schemaReady) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  ).run();
  schemaReady = true;
}

const MODES: readonly string[] = [...REVEAL_MODES, "random"];

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function duration(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(300, Math.max(5, Math.round(n))) : undefined;
}

/** Normalise untrusted deck JSON. */
export function sanitizeDeck(input: unknown): Deck {
  const d = (input ?? {}) as Record<string, unknown>;
  const pictures = Array.isArray(d.pictures) ? d.pictures.slice(0, MAX_DECK_PICTURES) : [];
  /** Picture ids must be unique: the editor uses them as React keys and to target edits. */
  const seenIds = new Set<string>();
  return {
    title: str(d.title, 80),
    defaultMode: (MODES.includes(d.defaultMode as string) ? d.defaultMode : "random") as RevealModeSetting,
    defaultDurationSec: duration(d.defaultDurationSec) ?? 30,
    pictures: pictures
      .map((raw): Picture | null => {
        const p = (raw ?? {}) as Record<string, unknown>;
        const imageKey = str(p.imageKey, 100);
        if (!/^img\/[\w-]+\.\w+$/.test(imageKey)) return null;
        let id = str(p.id, 40);
        if (!id || seenIds.has(id)) id = randomId(8);
        seenIds.add(id);
        const pic: Picture = { id, imageKey, answer: str(p.answer, 120) };
        if (MODES.includes(p.mode as string)) pic.mode = p.mode as RevealModeSetting;
        const dur = duration(p.durationSec);
        if (dur) pic.durationSec = dur;
        const credit = str(p.credit, 300);
        if (credit) pic.credit = credit;
        return pic;
      })
      .filter((p): p is Picture => p !== null),
  };
}

export async function createDeck(env: Env, deck: Deck): Promise<{ id: string; key: string }> {
  await ensureSchema(env);
  const id = randomId(10);
  const key = randomId(24);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO decks (id, key_hash, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, await sha256(key), JSON.stringify(deck), now, now)
    .run();
  return { id, key };
}

/** Load a deck, verifying the edit key. */
export async function loadDeck(env: Env, id: string, key: string): Promise<Deck> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT key_hash, data FROM decks WHERE id = ?")
    .bind(id)
    .first<{ key_hash: string; data: string }>();
  if (!row) throw new HttpError(404, "Deck not found");
  if (row.key_hash !== (await sha256(key))) throw new HttpError(403, "Wrong deck key");
  return JSON.parse(row.data) as Deck;
}

export async function saveDeck(env: Env, id: string, key: string, deck: Deck): Promise<void> {
  await loadDeck(env, id, key); // auth check
  await env.DB.prepare("UPDATE decks SET data = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(deck), Date.now(), id)
    .run();
}

export async function deleteDeck(env: Env, id: string, key: string): Promise<void> {
  await loadDeck(env, id, key);
  await env.DB.prepare("DELETE FROM decks WHERE id = ?").bind(id).run();
}
