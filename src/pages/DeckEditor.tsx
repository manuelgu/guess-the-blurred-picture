import { useEffect, useRef, useState } from "react";
import { MAX_DECK_PICTURES, REVEAL_MODES, type Deck, type Picture, type RevealModeSetting } from "../../shared/types";
import { ApiError, api, imageUrl, resizeImage, type CommonsResult } from "../api";
import { Centered, ModeSelect, useArmed } from "../components";
import { useI18n } from "../i18n";
import { navigate } from "../router";
import { RevealStage } from "../reveal/RevealStage";
import { savedDecks } from "../storage";

const newId = () => crypto.randomUUID().slice(0, 8);

/** Use the file name as answer unless it looks like a camera default (IMG_1234, DSC0001, …). */
function answerFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  // Prefix followed by a separator, digit or end, so "IMG20230101", "DSCF1234" and "GOPR0001" count but "Imagine" doesn't.
  if (/^(img|dsc[fn]?|pxl|vid|gopr|photo|image|screenshot|whatsapp|signal|dcim)(?=[\s\d]|$)/i.test(base) || /^[\d\s]+$/.test(base))
    return "";
  return base;
}

export function DeckEditor({ id }: { id: string }) {
  const { t } = useI18n();
  const [key] = useState(() => {
    const fromHash = location.hash.slice(1);
    return fromHash || savedDecks.key(id) || "";
  });
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "failed">("saved");
  const [uploading, setUploading] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [previewing, setPreviewing] = useState<Picture | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteArmed, setDeleteArmed] = useArmed<true>();
  /** JSON of the deck as last loaded/saved; autosave only fires on real changes. */
  const lastSaved = useRef("");

  useEffect(() => {
    if (!key) {
      setLoadError(true);
      return;
    }
    api
      .getDeck(id, key)
      .then((d) => {
        lastSaved.current = JSON.stringify(d);
        setDeck(d);
        savedDecks.upsert({ id, key, title: d.title, count: d.pictures.length });
      })
      .catch(() => setLoadError(true));
  }, [id, key]);

  /** Latest deck state, so a pending edit can be flushed when the editor unmounts. */
  const latest = useRef<Deck | null>(null);
  latest.current = deck;
  /** Set once the deck is being deleted: no more saves, and don't re-add it to the saved list. */
  const deleted = useRef(false);
  /** Set when the editor unmounts, so uploads still in flight are saved instead of dropped. */
  const unmounted = useRef(false);
  /** Saves run one after another so an older PUT can never land after a newer one. */
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  /** Photo uploads picked but not yet added to the deck. */
  const inFlight = useRef(0);
  const persist = (d: Deck): Promise<void> => {
    const run = saveChain.current
      .catch(() => {})
      .then(async () => {
        const json = JSON.stringify(d);
        if (deleted.current || json === lastSaved.current) return;
        await api.saveDeck(id, key, d);
        lastSaved.current = json;
        if (!deleted.current) savedDecks.upsert({ id, key, title: d.title, count: d.pictures.length });
      });
    saveChain.current = run;
    return run;
  };

  // Debounced autosave.
  useEffect(() => {
    if (!deck) return;
    if (JSON.stringify(deck) === lastSaved.current) {
      setSaveState((st) => (st === "saving" ? "saved" : st));
      return;
    }
    setSaveState("saving");
    const timer = setTimeout(() => {
      persist(deck)
        .then(() => {
          if (JSON.stringify(latest.current) === lastSaved.current) setSaveState("saved");
        })
        .catch(() => setSaveState("failed"));
    }, 700);
    return () => clearTimeout(timer);
  }, [deck, id, key]);

  // Flush an edit made within the debounce window when leaving the editor.
  useEffect(() => {
    // Reset on (re)mount: StrictMode runs this cleanup once in dev without a real unmount.
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      if (latest.current) persist(latest.current).catch(() => {});
    };
  }, []);

  if (loadError)
    return (
      <Centered>
        <div className="card narrow">
          <p>{t("deckNotFound")}</p>
          <a className="btn" href="/">
            {t("home")}
          </a>
        </div>
      </Centered>
    );
  if (!deck) return <Centered>…</Centered>;

  const update = (fn: (d: Deck) => Deck) => setDeck((d) => (d ? fn(d) : d));
  const updatePic = (picId: string, patch: Partial<Picture>) =>
    update((d) => ({ ...d, pictures: d.pictures.map((p) => (p.id === picId ? { ...p, ...patch } : p)) }));
  const removePic = (picId: string) => update((d) => ({ ...d, pictures: d.pictures.filter((p) => p.id !== picId) }));
  const movePic = (index: number, dir: -1 | 1) =>
    update((d) => {
      const pics = [...d.pictures];
      const j = index + dir;
      if (j < 0 || j >= pics.length) return d;
      [pics[index], pics[j]] = [pics[j], pics[index]];
      return { ...d, pictures: pics };
    });
  /** Returns false when the picture was not added (deck full or deleted). */
  const addPic = (pic: Picture): boolean => {
    // The server silently drops pictures past the cap, so never add them locally either.
    if (!latest.current || latest.current.pictures.length >= MAX_DECK_PICTURES) return false;
    // Keep `latest` current between renders so back-to-back adds see each other at the cap.
    latest.current = { ...latest.current, pictures: [...latest.current.pictures, pic] };
    if (!unmounted.current) {
      update((d) => (d.pictures.length >= MAX_DECK_PICTURES ? d : { ...d, pictures: [...d.pictures, pic] }));
      return true;
    }
    // Finished after leaving the editor: save it directly so the uploaded image isn't lost.
    persist(latest.current).catch(() => {});
    return true;
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    // Count uploads still in flight from an earlier pick too, or they'd be uploaded and then dropped at the cap.
    const room = MAX_DECK_PICTURES - (latest.current?.pictures.length ?? 0) - inFlight.current;
    const list = Array.from(files)
      .filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
      .slice(0, Math.max(0, room));
    inFlight.current += list.length;
    setUploading((n) => n + list.length);
    // Decode/resize a few at a time: decoding dozens of camera photos at once can exhaust phone memory.
    let next = 0;
    const worker = async () => {
      while (next < list.length) {
        const file = list[next++];
        try {
          const blob = await resizeImage(file);
          const { imageKey } = await api.uploadImage(id, key, blob);
          addPic({ id: newId(), imageKey, answer: answerFromFileName(file.name) });
        } catch (e) {
          console.error(e);
        } finally {
          inFlight.current -= 1;
          setUploading((n) => n - 1);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, list.length) }, worker));
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${location.origin}/decks/${id}#${key}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const deleteDeck = async () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    // Stop autosaves and let any in-flight PUT finish first, so it can't re-add the deck to the saved list.
    deleted.current = true;
    await saveChain.current.catch(() => {});
    try {
      await api.deleteDeck(id, key);
    } catch (e) {
      // Already gone is fine; anything else means the deck still exists, so keep its key.
      if (!(e instanceof ApiError && e.status === 404)) {
        deleted.current = false;
        setDeleteArmed(null);
        setSaveState("failed");
        return;
      }
    }
    latest.current = null; // nothing to flush on unmount
    savedDecks.remove(id);
    navigate("/");
  };

  return (
    <div className="editor">
      <header className="editor-top">
        <button className="btn ghost small" onClick={() => navigate("/")}>
          ← {t("back")}
        </button>
        <span className={`save-state ${saveState}`}>
          {saveState === "saved" ? `✓ ${t("saved")}` : saveState === "saving" ? t("saving") : `⚠ ${t("saveFailed")}`}
        </span>
      </header>

      <section className="card stack">
        <label className="field">
          <span>{t("deckTitle")}</span>
          <input
            value={deck.title}
            placeholder={t("untitledDeck")}
            onChange={(e) => update((d) => ({ ...d, title: e.target.value.slice(0, 80) }))}
          />
        </label>
        <div className="row wrap">
          <label className="field">
            <span>{t("defaultMode")}</span>
            <ModeSelect value={deck.defaultMode} onChange={(v) => update((d) => ({ ...d, defaultMode: v ?? "random" }))} />
          </label>
          <label className="field">
            <span>{t("defaultDuration")}</span>
            <input
              type="number"
              min={5}
              max={300}
              value={deck.defaultDurationSec}
              onChange={(e) => update((d) => ({ ...d, defaultDurationSec: Number(e.target.value) || 0 }))}
              onBlur={() =>
                update((d) => ({ ...d, defaultDurationSec: Math.max(5, Math.min(300, d.defaultDurationSec || 30)) }))
              }
            />
          </label>
        </div>
        <div className="row wrap">
          <button className="btn small" onClick={copyLink}>
            🔗 {copied ? t("copied") : t("copyEditLink")}
          </button>
          <span className="muted small">{t("editLinkHint")}</span>
        </div>
      </section>

      <section className="card stack">
        <h2>{t("addPictures")}</h2>
        <div className="row wrap">
          <label className="btn primary">
            📷 {t("uploadPhotos")}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = ""; // allow picking the same file(s) again
              }}
            />
          </label>
          <button className="btn" onClick={() => setShowSearch(!showSearch)}>
            🔎 {t("searchWikimedia")}
          </button>
          {uploading > 0 && <span className="muted">{t("uploading", { n: uploading })}</span>}
        </div>
        {showSearch && (
          <CommonsSearch deckId={id} deckKey={key} full={deck.pictures.length >= MAX_DECK_PICTURES} onAdd={addPic} />
        )}
      </section>

      <section className="card stack">
        <h2>
          {t("pictures", { n: deck.pictures.length })}
        </h2>
        {deck.pictures.length === 0 && <p className="muted">{t("emptyDeck")}</p>}
        <ul className="pic-list">
          {deck.pictures.map((p, i) => (
            <li key={p.id} className="pic-row">
              <button className="thumb" onClick={() => setPreviewing(p)} title={t("preview")}>
                <img src={imageUrl(p.imageKey)} alt="" loading="lazy" />
                <span className="thumb-play">▶</span>
              </button>
              <div className="pic-fields">
                <input
                  className={p.answer.trim() ? "" : "missing"}
                  value={p.answer}
                  placeholder={t("answer")}
                  onChange={(e) => updatePic(p.id, { answer: e.target.value.slice(0, 120) })}
                />
                {!p.answer.trim() && <span className="hint-warn">{t("answerMissing")}</span>}
                <div className="row wrap">
                  <ModeSelect value={p.mode} allowDefault onChange={(v) => updatePic(p.id, { mode: v })} />
                  <input
                    className="dur"
                    type="number"
                    min={5}
                    max={300}
                    placeholder={`${deck.defaultDurationSec}s`}
                    value={p.durationSec ?? ""}
                    onChange={(e) => updatePic(p.id, { durationSec: e.target.value ? Number(e.target.value) : undefined })}
                    onBlur={() =>
                      p.durationSec !== undefined &&
                      updatePic(p.id, { durationSec: p.durationSec > 0 ? Math.max(5, Math.min(300, p.durationSec)) : undefined })
                    }
                  />
                  <span className="muted small">s</span>
                </div>
                {p.credit && <span className="muted tiny">📷 {p.credit}</span>}
              </div>
              <div className="pic-actions">
                <button className="mini" onClick={() => movePic(i, -1)} disabled={i === 0} title={t("moveUp")}>
                  ↑
                </button>
                <button className="mini" onClick={() => movePic(i, 1)} disabled={i === deck.pictures.length - 1} title={t("moveDown")}>
                  ↓
                </button>
                <button className="mini danger" onClick={() => removePic(p.id)} title={t("remove")}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <button className={`btn ghost small ${deleteArmed ? "danger" : ""}`} onClick={deleteDeck}>
        {deleteArmed ? t("confirmDelete") : t("deleteDeck")}
      </button>

      {previewing && (
        <PreviewModal
          pic={previewing}
          mode={previewing.mode ?? deck.defaultMode}
          durationSec={previewing.durationSec ?? deck.defaultDurationSec}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}

function CommonsSearch({
  deckId,
  deckKey,
  full,
  onAdd,
}: {
  deckId: string;
  deckKey: string;
  /** Deck is at the picture cap: further adds would be dropped, so don't import them. */
  full: boolean;
  onAdd: (p: Picture) => boolean;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CommonsResult[] | null>(null);
  const [offset, setOffset] = useState(0);
  /** The query the current results belong to; "load more" pages that, not whatever is typed now. */
  const [resultsQuery, setResultsQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Record<string, "adding" | "added" | "error">>({});

  const search = async (more = false) => {
    const query = more ? resultsQuery : q;
    if (!query.trim()) return;
    setLoading(true);
    const nextOffset = more ? offset + 30 : 0;
    try {
      const res = await api.searchCommons(query, nextOffset);
      setResults((prev) => (more && prev ? [...prev, ...res] : res));
      setOffset(nextOffset);
      setResultsQuery(query);
    } catch (e) {
      console.error(e);
      if (!more) setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const add = async (r: CommonsResult) => {
    if (full || status[r.title] === "adding" || status[r.title] === "added") return; // errors may be retried
    setStatus((s) => ({ ...s, [r.title]: "adding" }));
    try {
      const { imageKey, credit } = await api.importCommons(deckId, deckKey, r.title);
      const added = onAdd({ id: newId(), imageKey, answer: r.suggestedAnswer, credit });
      setStatus((s) => ({ ...s, [r.title]: added ? "added" : "error" }));
    } catch {
      setStatus((s) => ({ ...s, [r.title]: "error" }));
    }
  };

  return (
    <div className="commons">
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} autoFocus />
        <button className="btn primary" disabled={loading}>
          {t("search")}
        </button>
      </form>
      {results && results.length === 0 && <p className="muted">{t("noResults")}</p>}
      {results && results.length > 0 && (
        <>
          <div className="commons-grid">
            {results.map((r) => (
              <button key={r.title} className={`commons-item ${status[r.title] ?? ""}`} onClick={() => add(r)} disabled={full} title={r.title}>
                <img src={r.thumbUrl} alt="" loading="lazy" />
                <span className="commons-label">
                  {status[r.title] === "added" ? `✓ ${t("added")}` : status[r.title] === "adding" ? "…" : status[r.title] === "error" ? "⚠" : r.suggestedAnswer}
                </span>
              </button>
            ))}
          </div>
          <button className="btn small" onClick={() => search(true)} disabled={loading}>
            {t("loadMore")}
          </button>
        </>
      )}
    </div>
  );
}

function PreviewModal({
  pic,
  mode,
  durationSec,
  onClose,
}: {
  pic: Picture;
  mode: RevealModeSetting;
  durationSec: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [start] = useState(() => performance.now());
  const [cycle, setCycle] = useState(0);
  // Preview plays the whole reveal in ~6 seconds, with a short hold at the end.
  const previewMs = 6000;
  const holdMs = 1200;
  const durationMs = Math.max(5, durationSec || 30) * 1000;
  const effectiveMode = mode === "random" ? REVEAL_MODES[cycle % REVEAL_MODES.length] : mode;

  useEffect(() => {
    const id = setInterval(() => setCycle(Math.floor((performance.now() - start) / (previewMs + holdMs))), 250);
    return () => clearInterval(id);
  }, [start]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="preview-stage">
          <RevealStage
            imageUrl={imageUrl(pic.imageKey)}
            mode={effectiveMode}
            seed={1234 + cycle}
            durationMs={durationMs}
            getElapsed={() => {
              const local = (performance.now() - start) % (previewMs + holdMs);
              return Math.min(1, local / previewMs) * durationMs;
            }}
          />
        </div>
        <div className="row spread">
          <span>
            <strong>{pic.answer}</strong> · {t(`mode_${effectiveMode}`)}
          </span>
          <button className="btn small" onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
