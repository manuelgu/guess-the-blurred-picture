// Built-in packs: the format of `packs/*.json` in the repo and of the bundle the sync script
// uploads to R2. Shared by the Worker (which reads the bundle) and scripts/sync-packs.ts (which
// builds it), so both apply exactly the same rules.
//
// Imports use the .ts extension so Node can run the sync script directly (type stripping).

import { commonsKey, isRevealModeSetting, MAX_ANSWER_LENGTH, MAX_DECK_PICTURES, REVEAL_MODE_SETTINGS, WIKI_REF, type RevealModeSetting } from "./types.ts";

export const PACK_LANGS = ["en", "de", "sv"] as const;
export type PackLang = (typeof PACK_LANGS)[number];

export interface PackPicture {
  answer: string;
  /** Wikimedia Commons file title, "File:…". */
  file: string;
  /** The Wikipedia article the picture was taken from ("sv:Karlatornet"). */
  wiki?: string;
}

export interface Pack {
  id: string;
  title: Record<PackLang, string>;
  emoji: string;
  defaultMode: RevealModeSetting;
  pictures: PackPicture[];
}

/**
 * Bump only for an incompatible format change. The version is part of the R2 key, so old and new
 * Workers each keep reading their own bundle: upload the new one (`npm run sync-packs -- --remote`)
 * before deploying the Worker that reads it, and nothing ever sees a bundle it can't parse.
 */
export const PACK_BUNDLE_VERSION = 1;
/** R2 key of the bundle. Outside `img/`, so the public image route can't serve it and uploads can't overwrite it. */
export const PACK_BUNDLE_KEY = `packs/bundle-v${PACK_BUNDLE_VERSION}.json`;

export interface PackBundle {
  version: typeof PACK_BUNDLE_VERSION;
  /** Git commit the bundle was built from, for tracing what is live. */
  commit?: string;
  builtAt: string;
  packs: Pack[];
}

/** Ids end up in URLs (/api/packs/<id>/use) and file names (packs/<id>.json). */
export const PACK_ID = /^(?!order$)[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/; // "order" is packs/order.json

const MAX_FILE = 255;
const MAX_TITLE = 60;
const MAX_EMOJI = 16;
const PACK_KEYS = new Set(["id", "title", "emoji", "defaultMode", "pictures"]);
const PICTURE_KEYS = new Set(["answer", "file", "wiki"]);

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const nonEmpty = (v: unknown, max: number): v is string => typeof v === "string" && v.trim() !== "" && v.length <= max;

/**
 * Checks one pack. Returns the pack (only known fields, so stray data never reaches clients) or the
 * list of problems.
 *
 * The sync script is strict: a typo like "wikki" should fail the sync, not vanish quietly. The Worker
 * passes `lenient`, because the bundle can be newer than the running code (CI uploads it in seconds,
 * a Worker deploy takes longer): a new optional field is ignored and a new reveal mode plays as
 * "random" instead of the whole pack disappearing until the deploy lands.
 */
export function validatePack(
  raw: unknown,
  { lenient = false }: { lenient?: boolean } = {},
): { pack: Pack; errors?: never } | { pack?: never; errors: string[] } {
  const errors: string[] = [];
  if (!isObject(raw)) return { errors: ["must be a JSON object"] };

  if (!lenient) for (const k of Object.keys(raw)) if (!PACK_KEYS.has(k)) errors.push(`unknown field "${k}"`);

  const { id, title, emoji, defaultMode, pictures } = raw;
  if (typeof id !== "string" || !PACK_ID.test(id)) {
    errors.push(`"id" must be lower-case letters, digits and dashes (1–40 chars)`);
  }

  if (!isObject(title)) {
    errors.push(`"title" must be an object with ${PACK_LANGS.join(", ")}`);
  } else {
    for (const lang of PACK_LANGS) {
      if (!nonEmpty(title[lang], MAX_TITLE)) errors.push(`"title.${lang}" must be a non-empty string (max ${MAX_TITLE} chars)`);
    }
    for (const k of Object.keys(title)) {
      if (!lenient && !(PACK_LANGS as readonly string[]).includes(k)) errors.push(`unknown language "title.${k}"`);
    }
  }

  if (!nonEmpty(emoji, MAX_EMOJI)) errors.push(`"emoji" must be a non-empty string`);
  const mode: RevealModeSetting | undefined = isRevealModeSetting(defaultMode) ? defaultMode : lenient ? "random" : undefined;
  if (!mode) {
    errors.push(`"defaultMode" must be one of ${REVEAL_MODE_SETTINGS.join(", ")}`);
  }

  const cleanPictures: PackPicture[] = [];
  if (!Array.isArray(pictures) || pictures.length === 0) {
    errors.push(`"pictures" must be a non-empty array`);
  } else {
    if (pictures.length > MAX_DECK_PICTURES) errors.push(`at most ${MAX_DECK_PICTURES} pictures per pack`);
    const seenFiles = new Map<string, number>();
    pictures.forEach((p, i) => {
      const at = `pictures[${i}]`;
      if (!isObject(p)) {
        errors.push(`${at} must be an object`);
        return;
      }
      if (!lenient) for (const k of Object.keys(p)) if (!PICTURE_KEYS.has(k)) errors.push(`${at}: unknown field "${k}"`);
      if (!nonEmpty(p.answer, MAX_ANSWER_LENGTH)) errors.push(`${at}: "answer" must be a non-empty string (max ${MAX_ANSWER_LENGTH} chars)`);
      if (typeof p.file !== "string" || !/^File:\S/.test(p.file) || p.file.length > MAX_FILE) {
        errors.push(`${at}: "file" must be a Commons file title starting with "File:"`);
      } else {
        // The same normalisation the Worker uses to store images: these would be one picture twice.
        const key = commonsKey(p.file);
        const prev = seenFiles.get(key);
        if (prev !== undefined) errors.push(`${at}: same file as pictures[${prev}]`);
        else seenFiles.set(key, i);
      }
      if (p.wiki !== undefined && (typeof p.wiki !== "string" || !WIKI_REF.test(p.wiki))) {
        errors.push(`${at}: "wiki" must look like "en:Article title"`);
      }
      cleanPictures.push({
        answer: String(p.answer ?? "").trim(),
        file: String(p.file ?? ""),
        ...(typeof p.wiki === "string" ? { wiki: p.wiki } : {}),
      });
    });
  }

  if (errors.length > 0) return { errors };
  const t = title as Record<PackLang, string>;
  return {
    pack: {
      id: id as string,
      title: { en: t.en.trim(), de: t.de.trim(), sv: t.sv.trim() },
      emoji: (emoji as string).trim(),
      defaultMode: mode!,
      pictures: cleanPictures,
    },
  };
}
