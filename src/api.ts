import type { CommonsResult, CreateRoomResponse, Deck } from "../shared/types";

export type { CommonsResult };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit & { deckKey?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.deckKey) headers.set("x-deck-key", init.deckKey);
  if (init.body && typeof init.body === "string") headers.set("content-type", "application/json");
  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? res.statusText);
  return data as T;
}

export interface PackInfo {
  id: string;
  title: Record<string, string>;
  emoji: string;
  count: number;
}

export const api = {
  createDeck: (deck: Deck) => call<{ id: string; key: string }>("/api/decks", { method: "POST", body: JSON.stringify(deck) }),
  getDeck: (id: string, key: string) => call<Deck>(`/api/decks/${id}`, { deckKey: key }),
  saveDeck: (id: string, key: string, deck: Deck) =>
    call<Deck>(`/api/decks/${id}`, { method: "PUT", deckKey: key, body: JSON.stringify(deck) }),
  deleteDeck: (id: string, key: string) => call(`/api/decks/${id}`, { method: "DELETE", deckKey: key }),
  uploadImage: (id: string, key: string, blob: Blob) =>
    call<{ imageKey: string }>(`/api/decks/${id}/images`, {
      method: "POST",
      deckKey: key,
      body: blob,
      headers: { "content-type": blob.type },
    }),
  importCommons: (id: string, key: string, title: string) =>
    call<{ imageKey: string; credit: string }>(`/api/decks/${id}/images/commons`, {
      method: "POST",
      deckKey: key,
      body: JSON.stringify({ title }),
    }),
  searchCommons: (q: string, offset = 0) =>
    call<CommonsResult[]>(`/api/commons/search?q=${encodeURIComponent(q)}&offset=${offset}`),
  packs: () => call<PackInfo[]>("/api/packs"),
  usePack: (packId: string, lang: string) =>
    call<{ id: string; key: string; title: string; count: number }>(`/api/packs/${packId}/use`, {
      method: "POST",
      body: JSON.stringify({ lang }),
    }),
  createRoom: (deckId: string, key: string, shuffle: boolean) =>
    call<CreateRoomResponse>("/api/rooms", { method: "POST", body: JSON.stringify({ deckId, key, shuffle }) }),
};

export { imageUrl } from "../shared/types";

/** Downscale a photo in the browser so the TV loads it fast. */
export async function resizeImage(file: File, maxSide = 1600): Promise<Blob> {
  let source: CanvasImageSource & { width: number; height: number };
  try {
    source = await createImageBitmap(file);
  } catch {
    // Fallback (e.g. HEIC on Safari decodes via <img> but not createImageBitmap)
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } finally {
      URL.revokeObjectURL(url);
    }
    source = img;
  }
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  // JPEG has no alpha: transparent areas (logos, PNG cut-outs) would otherwise turn black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (source instanceof ImageBitmap) source.close(); // free decoded pixels right away
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.86),
  );
}
