import { emptyDeck, REVEAL_MODES, type CreateRoomResponse, type Deck, type RevealModeSetting } from "../shared/types";
import { commonsKey, importCommonsBatch, importFromCommons, searchCommons } from "./commons";
import { createDeck, deleteDeck, loadDeck, sanitizeDeck, saveDeck } from "./decks";
import type { Env } from "./env";
import { HttpError, IMAGE_TYPE, imageExt, json, randomId } from "./http";
import { PACKS, type Pack } from "./packs";

export { Room } from "./room";

const ROOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ"; // no I, L, O
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function roomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => ROOM_ALPHABET[b % ROOM_ALPHABET.length]).join("");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const deckKey = (req: Request) => req.headers.get("x-deck-key") ?? "";

async function handleApi(req: Request, env: Env, url: URL): Promise<Response> {
  const parts = url.pathname.split("/").filter(Boolean).slice(1); // drop "api"
  const [a, b, c, d] = parts;
  const method = req.method;

  // --- Rooms ---
  if (a === "rooms" && !b && method === "POST") {
    const body = (await req.json().catch(() => ({}))) as { deckId?: unknown; key?: unknown; shuffle?: boolean; count?: unknown; mode?: unknown };
    if (typeof body.deckId !== "string" || typeof body.key !== "string") throw new HttpError(400, "Missing deck");
    const deck = await loadDeck(env, body.deckId, body.key);
    const pictures = deck.pictures.filter((p) => p.answer.trim());
    if (pictures.length === 0) throw new HttpError(400, "Deck has no pictures with answers");
    const ordered = body.shuffle ? shuffle(pictures) : pictures;
    // Optional "play only N pictures": the first N after shuffling (or in deck order).
    const count = Number(body.count);
    const limit = Number.isInteger(count) && count > 0 ? count : ordered.length;
    let roomDeck: Deck = { ...deck, pictures: ordered.slice(0, limit) };
    // Optional reveal-mode override for this game only: applies to every picture, including per-picture modes.
    if (typeof body.mode === "string" && (body.mode === "random" || (REVEAL_MODES as readonly string[]).includes(body.mode))) {
      const mode = body.mode as RevealModeSetting;
      roomDeck = { ...roomDeck, defaultMode: mode, pictures: roomDeck.pictures.map(({ mode: _m, ...p }) => p) };
    }
    for (let attempt = 0; attempt < 12; attempt++) {
      const code = roomCode();
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
      const res = await stub.fetch("https://room/init", {
        method: "POST",
        body: JSON.stringify({ code, deck: roomDeck }),
      });
      if (res.ok) return json((await res.json()) as CreateRoomResponse);
    }
    throw new HttpError(503, "Could not allocate a room code");
  }
  if (a === "rooms" && b && c === "ws") {
    const code = b.toUpperCase();
    if (!/^[A-Z]{4}$/.test(code)) throw new HttpError(400, "Bad room code");
    if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") throw new HttpError(426, "Expected websocket");
    const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
    const inner = new URL("https://room/ws");
    inner.search = url.search;
    return stub.fetch(new Request(inner, req));
  }

  // --- Decks ---
  if (a === "decks" && !b && method === "POST") {
    const deck = sanitizeDeck(await req.json().catch(() => emptyDeck()));
    return json(await createDeck(env, deck));
  }
  if (a === "decks" && b && !c) {
    if (method === "GET") return json(await loadDeck(env, b, deckKey(req)));
    if (method === "PUT") {
      const deck = sanitizeDeck(await req.json().catch(() => {
        throw new HttpError(400, "Bad JSON");
      }));
      await saveDeck(env, b, deckKey(req), deck);
      return json(deck);
    }
    if (method === "DELETE") {
      await deleteDeck(env, b, deckKey(req));
      return json({ ok: true });
    }
  }
  if (a === "decks" && b && c === "images" && method === "POST") {
    await loadDeck(env, b, deckKey(req)); // auth
    if (d === "commons") {
      const { title } = (await req.json().catch(() => ({}))) as { title?: unknown };
      if (typeof title !== "string") throw new HttpError(400, "Missing title");
      return json(await importFromCommons(env, title));
    }
    const type = req.headers.get("content-type") ?? "";
    if (!IMAGE_TYPE.test(type)) throw new HttpError(415, "Unsupported image type");
    // Require a length up front so a chunked body can't be buffered past the limit before the check below.
    const len = Number(req.headers.get("content-length"));
    if (!len) throw new HttpError(411, "Content-Length required");
    if (len > MAX_UPLOAD_BYTES) throw new HttpError(413, "Image too large");
    const buf = await req.arrayBuffer();
    if (buf.byteLength > MAX_UPLOAD_BYTES) throw new HttpError(413, "Image too large");
    const imageKey = `img/${randomId(16)}.${imageExt(type)}`;
    await env.IMAGES.put(imageKey, buf, { httpMetadata: { contentType: type } });
    return json({ imageKey });
  }

  // --- Images ---
  if (a === "images" && b === "img" && c && method === "GET") {
    const obj = await env.IMAGES.get(`img/${c}`);
    if (!obj) throw new HttpError(404, "Image not found");
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("etag", obj.httpEtag);
    headers.set("x-content-type-options", "nosniff");
    return new Response(obj.body, { headers });
  }

  // --- Wikimedia Commons search ---
  if (a === "commons" && b === "search" && method === "GET") {
    const results = await searchCommons(url.searchParams.get("q") ?? "", Math.max(0, Number(url.searchParams.get("offset")) || 0));
    return json(results);
  }

  // --- Built-in packs ---
  if (a === "packs" && !b && method === "GET") {
    return json(
      PACKS.map((p) => ({ id: p.id, title: p.title, emoji: p.emoji, count: p.pictures.length })),
    );
  }
  if (a === "packs" && b && c === "use" && method === "POST") {
    const pack = PACKS.find((p) => p.id === b);
    if (!pack) throw new HttpError(404, "Pack not found");
    const { lang, allowPartial } = (await req.json().catch(() => ({}))) as { lang?: unknown; allowPartial?: unknown };
    // "Use what arrived" builds the deck from stored pictures only, without contacting Wikimedia
    // (it's offered exactly when Wikimedia is struggling or asked us to wait).
    const usePartial = allowPartial === true;
    const { images: imported, retryable, retryAfterSec } = await importCommonsBatch(
      env,
      pack.pictures.map((p) => p.file),
      { cacheOnly: usePartial },
    );
    const imageFor = (p: { file: string }) => imported.get(commonsKey(p.file));
    const loaded = pack.pictures.filter(imageFor).length;
    const total = pack.pictures.length;
    // Pictures that failed permanently (gone from Commons…) are simply left out; retrying won't help.
    // Temporary failures are reported instead of quietly creating a short deck: the user can retry
    // (downloaded pictures are kept, so a retry only fetches the rest) or accept what arrived.
    if (retryable.length > 0 && !(usePartial && loaded > 0)) {
      throw new HttpError(503, `Only ${loaded} of ${total} pictures could be downloaded from Wikimedia.`, {
        code: "pack-incomplete",
        loaded,
        total,
        retryAfter: retryAfterSec,
      });
    }
    if (loaded === 0) throw new HttpError(502, "None of this pack's pictures are available on Wikimedia Commons.");
    const deck: Deck = {
      // Own-property check: an untrusted lang like "constructor" must not pick up an inherited value.
      title: typeof lang === "string" && Object.hasOwn(pack.title, lang) ? pack.title[lang as keyof Pack["title"]] : pack.title.en,
      defaultMode: pack.defaultMode,
      defaultDurationSec: 30,
      pictures: shuffle(pack.pictures).flatMap((p) => {
        const img = imageFor(p);
        return img
          ? [{ id: randomId(8), imageKey: img.imageKey, answer: p.answer, credit: img.credit, ...(p.wiki ? { wiki: p.wiki } : {}) }]
          : [];
      }),
    };
    return json({ ...(await createDeck(env, deck)), title: deck.title, count: deck.pictures.length });
  }

  throw new HttpError(404, "Not found");
}

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(req, env, url);
      } catch (err) {
        if (err instanceof HttpError) return json({ ...err.data, error: err.message }, err.status);
        console.error(err);
        return json({ error: "Internal error" }, 500);
      }
    }
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
