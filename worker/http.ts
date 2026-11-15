import { WIKIMEDIA_CLIENT } from "../shared/types";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Extra fields for the JSON error body (e.g. a machine-readable code). */
    public data?: Record<string, unknown>,
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

/**
 * Wikimedia User-Agent policy: "<client>/<version> (<contact>) <library>/<version>", with contact info
 * and "bot" in the name. Without it a client counts as unidentified (10 requests/min instead of 200).
 * https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits
 */
export const UA = `${WIKIMEDIA_CLIENT} cloudflare-workers`;

/** Raster image types we store in R2 and re-serve from our own origin. */
export const IMAGE_TYPE = /^image\/(jpeg|png|webp|gif)$/;

/** File extension for an IMAGE_TYPE content type. */
export const imageExt = (type: string) => (type === "image/jpeg" ? "jpg" : type.split("/")[1]);
