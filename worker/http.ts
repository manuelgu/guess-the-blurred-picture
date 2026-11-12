export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });

export function randomId(len = 10): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Wikimedia asks API clients to send an identifying User-Agent.
export const UA = "BlurBuzzPartyGame/0.1 (Cloudflare Worker)";

/** Raster image types we store in R2 and re-serve from our own origin. */
export const IMAGE_TYPE = /^image\/(jpeg|png|webp|gif)$/;

/** File extension for an IMAGE_TYPE content type. */
export const imageExt = (type: string) => (type === "image/jpeg" ? "jpg" : type.split("/")[1]);
