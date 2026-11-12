import { DurableObject } from "cloudflare:workers";
import {
  ANSWER_SECONDS,
  COUNTDOWN_MS,
  REVEAL_MODES,
  imageUrl,
  pointsFor,
  type ClientMessage,
  type Deck,
  type GameEvent,
  type RevealMode,
  type Role,
  type RoomView,
  type RoundStatus,
  type ServerMessage,
} from "../shared/types";
import type { Env } from "./env";
import { randomId } from "./http";

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PLAYERS = 40;
const PAIR_GRACE_MS = 15_000;

interface StoredPlayer {
  id: string;
  name: string;
  token: string;
  score: number;
}

interface RoundState {
  index: number;
  mode: RevealMode;
  durationMs: number;
  seed: number;
  status: RoundStatus;
  /** Accumulated reveal time at the last freeze point. Negative during the 3-2-1 countdown. */
  elapsedMs: number;
  /** Epoch ms since which the reveal has been running, or null if frozen. */
  runningSince: number | null;
  queue: string[];
  answerDeadline: number | null;
  lockedOut: string[];
  winnerId: string | null;
  pointsAwarded: number | null;
}

interface StoredState {
  code: string;
  createdAt: number;
  updatedAt: number;
  displayToken: string;
  pairToken: string | null;
  hostToken: string | null;
  /** The pair token most recently redeemed, so a racing duplicate connect from the same phone still works. */
  lastPair?: { token: string; at: number; device: string };
  deck: Deck;
  phase: "lobby" | "playing" | "finished";
  players: StoredPlayer[];
  kicked: string[];
  round: RoundState | null;
  eventSeq: number;
  lastEvent: GameEvent | null;
}

interface Attachment {
  role: Role;
  playerId?: string;
}

const token = () => randomId(28); // 140 bits

export class Room extends DurableObject<Env> {
  private s: StoredState | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"t":"ping"}', '{"t":"pong"}'));
    ctx.blockConcurrencyWhile(async () => {
      this.s = (await ctx.storage.get<StoredState>("state")) ?? null;
    });
  }

  // ---------- HTTP entry ----------

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/init" && request.method === "POST") {
      return this.init(await request.json());
    }
    if (url.pathname === "/ws") {
      return this.openSocket(url);
    }
    return new Response("Not found", { status: 404 });
  }

  private async init(body: { code: string; deck: Deck }): Promise<Response> {
    if (this.s && Date.now() - this.s.updatedAt < ROOM_TTL_MS) {
      return new Response("Room code in use", { status: 409 });
    }
    // An expired room whose alarm hasn't fired yet may still have sockets with stale player/host attachments.
    for (const ws of this.ctx.getWebSockets()) ws.close(1000, "expired");
    const now = Date.now();
    this.s = {
      code: body.code,
      createdAt: now,
      updatedAt: now,
      displayToken: token(),
      pairToken: token(),
      hostToken: null,
      deck: body.deck,
      phase: "lobby",
      players: [],
      kicked: [],
      round: null,
      eventSeq: 0,
      lastEvent: null,
    };
    await this.save();
    await this.ctx.storage.setAlarm(now + ROOM_TTL_MS);
    return Response.json({ code: body.code, displayToken: this.s.displayToken });
  }

  async alarm(): Promise<void> {
    if (this.s && Date.now() - this.s.updatedAt < ROOM_TTL_MS) {
      await this.ctx.storage.setAlarm(this.s.updatedAt + ROOM_TTL_MS);
      return;
    }
    for (const ws of this.ctx.getWebSockets()) ws.close(1000, "expired");
    this.s = null;
    await this.ctx.storage.deleteAll();
  }

  private openSocket(url: URL): Response {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);

    const fail = (code: string) => {
      this.send(server, { t: "error", code });
      server.close(4000, code);
      return new Response(null, { status: 101, webSocket: client });
    };

    const s = this.s;
    if (!s) return fail("no-room");

    const role = url.searchParams.get("role") as Role | null;
    const p = (k: string) => url.searchParams.get(k) ?? "";
    /** Whether stored state changed; a plain reconnect only needs a presence broadcast, not a storage write. */
    let changed = false;

    if (role === "display") {
      if (p("token") !== s.displayToken) return fail("display-auth");
      server.serializeAttachment({ role } satisfies Attachment);
      this.send(server, { t: "welcome", role });
    } else if (role === "host") {
      // The phone sends a random per-page-load device id with the pair token. Only that same
      // device may redeem the token again (double mount / reconnect race); any other phone gets "pair-used".
      const device = p("device").slice(0, 64);
      const recentlyPaired =
        p("pair") &&
        device &&
        s.lastPair?.token === p("pair") &&
        s.lastPair.device === device &&
        s.hostToken &&
        Date.now() - s.lastPair.at < PAIR_GRACE_MS;
      if (recentlyPaired) {
        // Same phone redeeming the same QR again within seconds: hand out the same token.
      } else if (p("pair") && s.pairToken && p("pair") === s.pairToken) {
        s.hostToken = token();
        s.lastPair = { token: s.pairToken, at: Date.now(), device };
        s.pairToken = null;
        this.closeHosts();
        changed = true;
      } else if (!(p("token") && p("token") === s.hostToken)) {
        return fail(p("pair") ? "pair-used" : "host-auth");
      }
      server.serializeAttachment({ role } satisfies Attachment);
      this.send(server, { t: "welcome", role, token: s.hostToken! });
    } else if (role === "player") {
      // Phones generate their own pid/ptoken before the first connect, so a duplicate or racing
      // connect re-attaches to the same player instead of creating a ghost "Bob 2".
      const pid = p("pid");
      const ptoken = p("ptoken");
      let player = s.players.find((pl) => pl.id === pid && pl.token === ptoken);
      if (!player) {
        if (s.kicked.includes(pid)) return fail("kicked");
        if (pid && s.players.some((pl) => pl.id === pid)) return fail("name-required"); // id taken, wrong token
        const rawName = p("name").trim().slice(0, 24);
        if (!rawName) return fail("name-required");
        if (s.players.length >= MAX_PLAYERS) return fail("room-full");
        const validClientIds = /^[\w-]{8,40}$/.test(pid) && /^[\w-]{16,80}$/.test(ptoken);
        player = {
          id: validClientIds ? pid : crypto.randomUUID().slice(0, 8),
          name: this.uniqueName(rawName),
          token: validClientIds ? ptoken : token(),
          score: 0,
        };
        s.players.push(player);
        this.event({ kind: "joined", playerId: player.id });
        changed = true;
      }
      server.serializeAttachment({ role, playerId: player.id } satisfies Attachment);
      this.send(server, { t: "welcome", role, token: player.token, playerId: player.id });
    } else {
      return fail("bad-role");
    }

    if (changed) this.ctx.waitUntil(this.commit());
    else this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  private uniqueName(name: string): string {
    const taken = new Set(this.s!.players.map((p) => p.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return name;
    for (let i = 2; ; i++) {
      const candidate = `${name} ${i}`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
  }

  // ---------- WebSocket events ----------

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const s = this.s;
    if (!s || typeof raw !== "string") return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;
    const att = ws.deserializeAttachment() as Attachment | null;
    if (!att) return;

    if (att.role === "player" && msg.t === "buzz" && att.playerId) {
      if (this.buzz(att.playerId)) await this.commit();
      return;
    }
    if (att.role === "display" && msg.t === "repair") {
      s.pairToken = token();
      s.hostToken = null;
      s.lastPair = undefined;
      this.closeHosts();
      await this.commit();
      return;
    }
    if (att.role !== "host") return;

    const changed = this.hostAction(msg);
    if (changed) await this.commit();
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    try {
      ws.close();
    } catch {
      /* already closed */
    }
    // Connection status changed; let everybody know.
    if (this.s) this.broadcast();
  }

  async webSocketError(): Promise<void> {
    if (this.s) this.broadcast();
  }

  // ---------- Game logic ----------

  private elapsed(r: RoundState, now = Date.now()): number {
    const e = r.elapsedMs + (r.runningSince !== null ? now - r.runningSince : 0);
    return Math.min(e, r.durationMs);
  }

  private freeze(r: RoundState, now = Date.now()) {
    r.elapsedMs = this.elapsed(r, now);
    r.runningSince = null;
  }

  private buzz(playerId: string): boolean {
    const r = this.s!.round;
    if (this.s!.phase !== "playing" || !r) return false;
    if (r.lockedOut.includes(playerId) || r.queue.includes(playerId)) return false;
    const now = Date.now();
    if (r.status === "revealing") {
      if (this.elapsed(r, now) < 0) return false; // still in 3-2-1
      this.freeze(r, now);
      r.status = "answering";
      r.queue = [playerId];
      r.answerDeadline = now + ANSWER_SECONDS * 1000;
      this.event({ kind: "buzz", playerId });
      return true;
    }
    if (r.status === "answering") {
      r.queue.push(playerId);
      return true;
    }
    return false;
  }

  private hostAction(msg: ClientMessage): boolean {
    const s = this.s!;
    const r = s.round;
    const now = Date.now();
    switch (msg.t) {
      case "start":
        if (s.phase === "playing") return false;
        if (s.phase === "finished") for (const p of s.players) p.score = 0;
        s.phase = "playing";
        this.startRound(0);
        return true;
      case "next": {
        if (s.phase !== "playing") return false;
        if (msg.from !== undefined && msg.from !== (r?.index ?? -1)) return false;
        const nextIndex = (r?.index ?? -1) + 1;
        if (nextIndex >= s.deck.pictures.length) this.finish();
        else this.startRound(nextIndex);
        return true;
      }
      case "pause":
        if (!r || r.status !== "revealing") return false;
        this.freeze(r, now);
        r.status = "paused";
        return true;
      case "resume":
        if (!r || r.status !== "paused") return false;
        r.status = "revealing";
        r.runningSince = now;
        return true;
      case "judge": {
        if (!r || r.status !== "answering" || r.queue.length === 0 || typeof msg.correct !== "boolean") return false;
        const pid = r.queue[0];
        if (msg.playerId !== undefined && msg.playerId !== pid) return false;
        const player = s.players.find((p) => p.id === pid);
        if (msg.correct) {
          const points = pointsFor(r.elapsedMs / r.durationMs);
          if (player) player.score += points;
          r.status = "solved";
          r.winnerId = pid;
          r.pointsAwarded = points;
          r.queue = [];
          r.answerDeadline = null;
          r.elapsedMs = r.durationMs;
          this.event({ kind: "correct", playerId: pid, points });
        } else {
          if (player) player.score -= 1;
          r.lockedOut.push(pid);
          this.event({ kind: "wrong", playerId: pid });
          r.queue.shift();
          this.advanceQueue(r, now);
        }
        return true;
      }
      case "reveal":
        if (!r || r.status === "solved" || r.status === "revealed") return false;
        r.status = "revealed";
        r.queue = [];
        r.answerDeadline = null;
        r.runningSince = null;
        r.elapsedMs = r.durationMs;
        this.event({ kind: "reveal" });
        return true;
      case "adjust": {
        const p = s.players.find((pl) => pl.id === msg.playerId);
        if (!p || !Number.isFinite(msg.delta)) return false;
        p.score += Math.max(-5, Math.min(5, Math.round(msg.delta)));
        return true;
      }
      case "kick": {
        const idx = s.players.findIndex((pl) => pl.id === msg.playerId);
        if (idx < 0) return false;
        s.players.splice(idx, 1);
        s.kicked.push(msg.playerId);
        for (const ws of this.socketsFor("player", msg.playerId)) {
          this.send(ws, { t: "error", code: "kicked" });
          ws.close(4000, "kicked");
        }
        if (r && r.queue.includes(msg.playerId)) {
          const wasAnswering = r.queue[0] === msg.playerId;
          r.queue = r.queue.filter((id) => id !== msg.playerId);
          if (wasAnswering && r.status === "answering") this.advanceQueue(r, now);
        }
        return true;
      }
      case "end":
        if (s.phase !== "playing") return false;
        this.finish();
        return true;
      default:
        return false;
    }
  }

  /** After the answering player is removed: hand the turn to the next in line, or resume the reveal. */
  private advanceQueue(r: RoundState, now: number) {
    if (r.queue.length > 0) {
      r.answerDeadline = now + ANSWER_SECONDS * 1000;
    } else {
      r.answerDeadline = null;
      r.status = "revealing";
      r.runningSince = now;
    }
  }

  private finish() {
    this.s!.phase = "finished";
    this.s!.round = null;
    this.event({ kind: "finished" });
  }

  private startRound(index: number) {
    const s = this.s!;
    const pic = s.deck.pictures[index];
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    let mode = pic.mode ?? s.deck.defaultMode;
    if (mode === "random") {
      const prev = s.round?.mode;
      const options = REVEAL_MODES.filter((m) => m !== prev);
      mode = options[seed % options.length];
    }
    const durationSec = pic.durationSec ?? s.deck.defaultDurationSec;
    s.round = {
      index,
      mode,
      durationMs: Math.max(5, durationSec) * 1000,
      seed,
      status: "revealing",
      elapsedMs: -COUNTDOWN_MS,
      runningSince: Date.now(),
      queue: [],
      answerDeadline: null,
      lockedOut: [],
      winnerId: null,
      pointsAwarded: null,
    };
    this.event({ kind: "round-start" });
  }

  private event(e: DistributiveOmit<GameEvent, "id">) {
    const s = this.s!;
    s.eventSeq += 1;
    s.lastEvent = { ...e, id: s.eventSeq } as GameEvent;
  }

  // ---------- Views & transport ----------

  private view(att: Attachment, now: number, connected: Set<string>, hostConnected: boolean): RoomView {
    const s = this.s!;
    const r = s.round;
    const isHost = att.role === "host";
    let round: RoomView["round"] = null;
    if (r) {
      const pic = s.deck.pictures[r.index];
      const over = r.status === "solved" || r.status === "revealed";
      round = {
        index: r.index,
        total: s.deck.pictures.length,
        // Players never render the picture; giving them the URL would let them open it unblurred.
        imageUrl: att.role === "player" && !over ? "" : imageUrl(pic.imageKey),
        mode: r.mode,
        durationMs: r.durationMs,
        seed: r.seed,
        status: r.status,
        elapsedMs: this.elapsed(r, now),
        running: r.runningSince !== null,
        queue: r.queue,
        answerRemainingMs: r.answerDeadline !== null ? r.answerDeadline - now : null,
        lockedOut: r.lockedOut,
        winnerId: r.winnerId,
        pointsAwarded: r.pointsAwarded,
        answer: isHost || over ? pic.answer : null,
        credit: over || isHost ? (pic.credit ?? null) : null,
      };
    }
    let nextAnswer: string | null = null;
    if (isHost) {
      const nextIdx = s.phase === "lobby" ? 0 : r ? r.index + 1 : -1;
      nextAnswer = s.phase !== "finished" ? (s.deck.pictures[nextIdx]?.answer ?? null) : null;
    }
    const you = att.role === "player" ? s.players.find((p) => p.id === att.playerId) : undefined;
    return {
      code: s.code,
      phase: s.phase,
      deckTitle: s.deck.title,
      hostPaired: s.hostToken !== null,
      hostConnected,
      players: s.players.map((p) => ({ id: p.id, name: p.name, score: p.score, connected: connected.has(p.id) })),
      round,
      lastEvent: s.lastEvent,
      pairToken: att.role === "display" ? s.pairToken : null,
      you: you ? { id: you.id, name: you.name } : null,
      nextAnswer,
    };
  }

  private socketsFor(role: Role, playerId?: string): WebSocket[] {
    return this.ctx.getWebSockets().filter((ws) => {
      const a = ws.deserializeAttachment() as Attachment | null;
      return a && a.role === role && (playerId === undefined || a.playerId === playerId);
    });
  }

  /** Kick out all current host connections (a new host was paired or pairing was reset). */
  private closeHosts() {
    for (const ws of this.socketsFor("host")) {
      this.send(ws, { t: "error", code: "host-replaced" });
      ws.close(4000, "host-replaced");
    }
  }

  private broadcast() {
    const now = Date.now();
    const sockets = this.ctx.getWebSockets().filter((ws) => ws.readyState === WebSocket.OPEN);
    // Deserialize each attachment once; it's needed for both the presence pass and the send pass.
    const targets = sockets.map((ws) => [ws, ws.deserializeAttachment() as Attachment | null] as const);
    const connected = new Set<string>();
    let hostConnected = false;
    for (const [, a] of targets) {
      if (a?.role === "player" && a.playerId) connected.add(a.playerId);
      if (a?.role === "host") hostConnected = true;
    }
    for (const [ws, a] of targets) {
      if (!a) continue;
      this.send(ws, { t: "state", state: this.view(a, now, connected, hostConnected) });
    }
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* socket gone */
    }
  }

  private touch() {
    if (this.s) this.s.updatedAt = Date.now();
  }

  private async save() {
    if (this.s) await this.ctx.storage.put("state", this.s);
  }

  private async commit() {
    this.touch();
    await this.save();
    this.broadcast();
  }
}

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
