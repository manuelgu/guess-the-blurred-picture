// Types shared between the Worker (Durable Object) and the React clients.

export const REVEAL_MODES = ["blur", "pixelate", "tiles", "zoom", "spotlight"] as const;
export type RevealMode = (typeof REVEAL_MODES)[number];
export type RevealModeSetting = RevealMode | "random";

export const ANSWER_SECONDS = 5;
export const COUNTDOWN_MS = 3000;
/** The server keeps at most this many pictures per deck; the editor must not let users add more. */
export const MAX_DECK_PICTURES = 200;
/** Every value a deck/pack/picture mode may take. */
export const REVEAL_MODE_SETTINGS: readonly RevealModeSetting[] = [...REVEAL_MODES, "random"];
export const isRevealModeSetting = (v: unknown): v is RevealModeSetting =>
  typeof v === "string" && (REVEAL_MODE_SETTINGS as readonly string[]).includes(v);
/** Longest answer a picture may have (decks and packs). */
export const MAX_ANSWER_LENGTH = 120;

// ---------- Decks ----------

/** Public URL of a stored image (served by the Worker from R2). */
export const imageUrl = (imageKey: string) => `/api/images/${imageKey}`;

export interface Picture {
  id: string;
  /** R2 object key, served from /api/images/<key> */
  imageKey: string;
  answer: string;
  mode?: RevealModeSetting;
  durationSec?: number;
  credit?: string;
  /** Wikipedia article about what's pictured, as "<lang>:<title>", e.g. "sv:Karlatornet". */
  wiki?: string;
}

/**
 * How we identify ourselves to Wikimedia (User-Agent policy: client/version plus contact info).
 * The Worker sends it as User-Agent, the browser as Api-User-Agent (browsers can't set User-Agent).
 */
export const WIKIMEDIA_CLIENT = "BlurBuzzBot/0.2 (https://github.com/manuelgu/guess-the-blurred-picture)";

/** "sv:Karlatornet" → { lang: "sv", title: "Karlatornet" } */
export const WIKI_REF = /^([a-z]{2,3}):(.{1,200})$/;

export interface Deck {
  title: string;
  defaultMode: RevealModeSetting;
  defaultDurationSec: number;
  pictures: Picture[];
}

export function emptyDeck(title = ""): Deck {
  return { title, defaultMode: "random", defaultDurationSec: 30, pictures: [] };
}

// ---------- Scoring ----------

/** Points for a correct answer, given how far the reveal had progressed (0..1). */
export function pointsFor(progress: number): number {
  if (progress < 1 / 3) return 3;
  if (progress < 2 / 3) return 2;
  return 1;
}

// ---------- Room protocol ----------

export type Role = "display" | "host" | "player";

export interface PlayerView {
  id: string;
  name: string;
  score: number;
  connected: boolean;
}

export type RoundStatus =
  /** Reveal is running (or counting down if elapsedMs < 0) */
  | "revealing"
  /** Host paused the reveal */
  | "paused"
  /** Someone buzzed; reveal frozen */
  | "answering"
  /** Someone got it right */
  | "solved"
  /** Host revealed the answer without a winner */
  | "revealed";

export interface RoundView {
  index: number;
  total: number;
  imageUrl: string;
  mode: RevealMode;
  durationMs: number;
  seed: number;
  status: RoundStatus;
  /** Reveal time elapsed at the moment the message was sent (negative = 3-2-1 countdown). */
  elapsedMs: number;
  /** Whether elapsedMs is advancing. */
  running: boolean;
  /** Players waiting to answer, in buzz order. queue[0] is answering. */
  queue: string[];
  /** ms left for queue[0] to answer, at the moment the message was sent. */
  answerRemainingMs: number | null;
  lockedOut: string[];
  winnerId: string | null;
  pointsAwarded: number | null;
  /** Only present for the host, or for everyone once solved/revealed. */
  answer: string | null;
  credit: string | null;
  /** Wikipedia article ("sv:Karlatornet"); same visibility as `answer`. */
  wiki: string | null;
}

export type GameEvent =
  | { id: number; kind: "buzz"; playerId: string }
  | { id: number; kind: "correct"; playerId: string; points: number }
  | { id: number; kind: "wrong"; playerId: string }
  | { id: number; kind: "reveal" }
  | { id: number; kind: "round-start" }
  | { id: number; kind: "joined"; playerId: string }
  | { id: number; kind: "finished" };

export interface RoomView {
  code: string;
  phase: "lobby" | "playing" | "finished";
  deckTitle: string;
  hostPaired: boolean;
  hostConnected: boolean;
  players: PlayerView[];
  round: RoundView | null;
  lastEvent: GameEvent | null;
  /** Display only, and only while no host is paired. */
  pairToken: string | null;
  /** Player only. */
  you: { id: string; name: string } | null;
  /** Host only: answer to the next picture, so the host can glance ahead. */
  nextAnswer: string | null;
}

export type ClientMessage =
  // player
  | { t: "buzz" }
  // host
  | { t: "start" }
  /** `from`: the round index the host was looking at, so a double tap can't skip a picture. */
  | { t: "next"; from?: number }
  | { t: "pause" }
  | { t: "resume" }
  /** `playerId`: who the host is judging, so a double tap can't judge the next player in line. */
  | { t: "judge"; correct: boolean; playerId?: string }
  | { t: "reveal" }
  | { t: "adjust"; playerId: string; delta: number }
  | { t: "kick"; playerId: string }
  | { t: "end" }
  // display
  | { t: "repair" }
  // any
  | { t: "ping" };

export type ServerMessage =
  | { t: "state"; state: RoomView }
  | { t: "welcome"; role: Role; token?: string; playerId?: string }
  | { t: "error"; code: string }
  | { t: "pong" };

/** One Wikimedia Commons search hit (GET /api/commons/search). */
export interface CommonsResult {
  title: string;
  thumbUrl: string;
  width: number;
  height: number;
  suggestedAnswer: string;
  credit: string;
}

export interface CreateRoomResponse {
  code: string;
  displayToken: string;
}

/**
 * Canonical form of a Commons file title, as MediaWiki normalises it: underscores are spaces,
 * "Image:" is an alias of "File:", and both the namespace and the name start upper-case.
 * ("file:puffin.jpg" → "File:Puffin.jpg"). Redirects are resolved separately via the API.
 */
export function commonsKey(title: string): string {
  const t = title.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const m = /^(file|image)\s*:\s*(.*)$/i.exec(t);
  const name = m ? m[2] : t;
  // Upper-case the first letter, but only 1:1 mappings ("ß" → "SS" is not how MediaWiki does it).
  const first = name.charAt(0);
  const upper = first.toUpperCase();
  return `File:${upper.length === 1 ? upper : first}${name.slice(1)}`;
}
