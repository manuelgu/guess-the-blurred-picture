import { useEffect, useState } from "react";
import { emptyDeck, type RevealModeSetting } from "../../shared/types";
import { api, ApiError, deleteSavedDeck, type PackInfo } from "../api";
import { ModeSelect, useArmed } from "../components";
import { LangPicker, useI18n } from "../i18n";
import { navigate } from "../router";
import { savedDecks, storage, type SavedDeck } from "../storage";
import { JoinForm } from "./Player";

export function Home() {
  const { t, lang } = useI18n();
  const [decks, setDecks] = useState<SavedDeck[]>(savedDecks.list);
  const [packs, setPacks] = useState<PackInfo[]>([]);
  const [busyPack, setBusyPack] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Deck id armed for deletion: first tap arms, second tap (within 3 s) deletes. */
  const [deleteArmed, setDeleteArmed] = useArmed<string>();
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteDeck = async (d: SavedDeck) => {
    if (deleting) return;
    if (deleteArmed !== d.id) {
      setDeleteArmed(d.id);
      return;
    }
    setDeleteArmed(null);
    setDeleting(d.id);
    setError(null);
    try {
      await deleteSavedDeck(d.id, d.key);
    } catch (e) {
      setError(String((e as Error).message));
      setDeleting(null);
      return;
    }
    setDecks(savedDecks.list());
    if (playing === d.id) setPlaying(null);
    setDeleting(null);
  };

  useEffect(() => {
    api.packs().then(setPacks).catch(() => {});
  }, []);

  const newDeck = async () => {
    try {
      const deck = emptyDeck();
      const { id, key } = await api.createDeck(deck);
      savedDecks.upsert({ id, key, title: "", count: 0 });
      navigate(`/decks/${id}#${key}`);
    } catch (e) {
      setError(String((e as Error).message));
    }
  };

  /** A pack whose pictures couldn't all be downloaded: offer retry or "use what we have". */
  const [incomplete, setIncomplete] = useState<{ pack: PackInfo; loaded: number; total: number; retryAt?: number } | null>(null);
  // Wikimedia asked us to wait: keep "Try again" disabled until then, so impatient clicks don't
  // keep the rate limit going.
  const retryIn = useSecondsUntil(incomplete?.retryAt);

  const usePack = async (pack: PackInfo, allowPartial = false) => {
    setBusyPack(pack.id);
    setError(null);
    setIncomplete(null);
    try {
      const { id, key, title, count } = await api.usePack(pack.id, lang, allowPartial);
      savedDecks.upsert({ id, key, title, count });
      setDecks(savedDecks.list());
    } catch (e) {
      const d = e instanceof ApiError ? e.data : {};
      if (d.code === "pack-incomplete" && typeof d.loaded === "number" && typeof d.total === "number") {
        const retryAt = typeof d.retryAfter === "number" && d.retryAfter > 0 ? Date.now() + d.retryAfter * 1000 : undefined;
        setIncomplete({ pack, loaded: d.loaded, total: d.total, retryAt });
      } else {
        setError(String((e as Error).message));
      }
    } finally {
      setBusyPack(null);
    }
  };

  return (
    <div className="home">
      <header className="home-hero">
        <div className="logo-blob" aria-hidden />
        <h1>{t("appName")}</h1>
        <p className="tagline">{t("tagline")}</p>
        <LangPicker />
      </header>

      <section className="card">
        <h2>📱 {t("joinGame")}</h2>
        <JoinForm />
      </section>

      <section className="card">
        <h2>📺 {t("hostGame")}</h2>
        <p className="muted small">{t("hostGameHint")}</p>
        {error && <p className="error">{error}</p>}

        <h3>{t("myDecks")}</h3>
        {decks.length === 0 && <p className="muted">{t("noDecks")}</p>}
        <ul className="deck-list">
          {decks.map((d) => (
            <li key={d.id}>
              <div className="deck-info">
                <strong>{d.title || t("untitledDeck")}</strong>
                <span className="muted small">{t("pictures", { n: d.count })}</span>
              </div>
              <button
                className={`btn small bare-btn ${deleteArmed === d.id ? "danger" : ""}`}
                onClick={() => deleteDeck(d)}
                disabled={deleting === d.id}
                aria-label={t("deleteDeck")}
                title={t("deleteDeck")}
              >
                {deleteArmed === d.id ? t("confirmDeleteShort") : "🗑"}
              </button>
              <button className="btn small" onClick={() => navigate(`/decks/${d.id}#${d.key}`)}>
                {t("edit")}
              </button>
              <button className="btn small primary" onClick={() => setPlaying(playing === d.id ? null : d.id)}>
                ▶ {t("play")}
              </button>
              {playing === d.id && <PlaySetup deck={d} onError={setError} />}
            </li>
          ))}
        </ul>
        <button className="btn" onClick={newDeck}>
          ＋ {t("newDeck")}
        </button>

        {packs.length > 0 && (
          <>
            <h3>{t("builtInPacks")}</h3>
            <div className="pack-grid">
              {packs.map((p) => (
                <button
                  key={p.id}
                  className="pack"
                  // While Wikimedia asked us to wait for this pack, its tile waits too (like "Try again").
                  disabled={!!busyPack || (incomplete?.pack.id === p.id && retryIn > 0)}
                  onClick={() => usePack(p)}
                >
                  <span className="pack-emoji">{p.emoji}</span>
                  <strong>{p.title[lang] ?? p.title.en}</strong>
                  <span className="muted small">
                    {busyPack === p.id ? t("preparingPack") : t("pictures", { n: p.count })}
                  </span>
                </button>
              ))}
            </div>
            {incomplete && (
              <div className="notice" role="alert">
                <p>
                  <strong>
                    {incomplete.pack.emoji} {incomplete.pack.title[lang] ?? incomplete.pack.title.en}
                  </strong>
                  : {t("packIncomplete", { loaded: incomplete.loaded, total: incomplete.total })}
                </p>
                <div className="row">
                  <button className="btn small primary" disabled={!!busyPack || retryIn > 0} onClick={() => usePack(incomplete.pack)}>
                    ↻ {t("tryAgain")}
                    {retryIn > 0 && ` (${formatWait(retryIn)})`}
                  </button>
                  {incomplete.loaded > 0 && (
                    <button className="btn small" disabled={!!busyPack} onClick={() => usePack(incomplete.pack, true)}>
                      {t("useAnyway", { n: incomplete.loaded })}
                    </button>
                  )}
                  <button className="btn small ghost" onClick={() => setIncomplete(null)}>
                    ✕
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/** Whole seconds until `until` (epoch ms), ticking once a second; 0 when unset or passed. */
function useSecondsUntil(until: number | undefined): number {
  const left = () => (until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0);
  const [secs, setSecs] = useState(left);
  useEffect(() => {
    setSecs(left());
    if (!until) return;
    const id = setInterval(() => {
      const s = left();
      setSecs(s);
      if (s === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until]);
  return secs;
}

/** 42 → "42 s", 600 → "10:00" */
const formatWait = (s: number) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

function PlaySetup({ deck, onError }: { deck: SavedDeck; onError: (e: string) => void }) {
  const { t } = useI18n();
  const [shuffle, setShuffle] = useState(() => storage.get<boolean>("shuffle") ?? true);
  const [busy, setBusy] = useState(false);
  /** Empty = play every picture. */
  const [count, setCount] = useState("");
  /** undefined = use the deck's own modes. */
  const [mode, setMode] = useState<RevealModeSetting | undefined>(undefined);
  /** The deck's current settings, to show what "as in deck" means (the saved list may be stale). */
  const [info, setInfo] = useState<{ mode: RevealModeSetting; mixed: boolean; count: number } | null>(null);
  /** Loading the deck's settings failed: don't leave "As in deck: …" spinning forever. */
  const [infoFailed, setInfoFailed] = useState(false);
  useEffect(() => {
    let live = true;
    api
      .getDeck(deck.id, deck.key)
      .then((d) => {
        if (!live) return;
        const playable = d.pictures.filter((p) => p.answer.trim());
        setInfo({ mode: d.defaultMode, mixed: playable.some((p) => p.mode && p.mode !== d.defaultMode), count: playable.length });
      })
      .catch((e) => {
        if (!live) return;
        setInfoFailed(true);
        // A missing deck or wrong key means "Create game" will fail too: say so now.
        if (e instanceof ApiError && (e.status === 404 || e.status === 403)) onError(e.message);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id, deck.key]);
  const total = info?.count ?? deck.count;
  const n = Number(count);
  /** Asked for more pictures than the deck has: play them all, and say so. */
  const tooMany = n > 0 && total > 0 && n > total;
  // Sent as typed; the server caps it at the real number of pictures (our `total` may be stale).
  const limit = n > 0 ? n : undefined;
  const create = async () => {
    setBusy(true);
    try {
      storage.set("shuffle", shuffle);
      const { code, displayToken } = await api.createRoom(deck.id, deck.key, { shuffle, count: limit, mode });
      storage.set(`display:${code}`, displayToken);
      navigate(`/tv/${code}`);
    } catch (e) {
      onError(String((e as Error).message));
      setBusy(false);
    }
  };
  return (
    <div className="play-setup">
      <label className="check">
        <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} /> {t("shuffle")}
      </label>
      <label className="count-field">
        {t("pictureCount")}
        {/* A text field with a numeric keyboard: type="number" reports "" for input like "12e",
            which would wipe what was typed. */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={count}
          placeholder={t("allN", { n: total })}
          // Digits only, no leading zeros: "0" (or "007") never means "zero pictures".
          onChange={(e) => setCount(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 3))}
          onKeyDown={(e) => e.key === "Enter" && !busy && create()}
        />
        {tooMany && <span className="muted small">{t("onlyN", { n: total })}</span>}
      </label>
      <label className="count-field">
        {t("modeLabel")}
        <ModeSelect
          value={mode}
          onChange={setMode}
          allowDefault
          defaultLabel={
            info
              ? `${t("asInDeck", { mode: t(`mode_${info.mode}`) })}${info.mixed ? ` ${t("plusPerPicture")}` : ""}`
              : infoFailed
                ? t("deckDefault")
                : t("asInDeck", { mode: "…" })
          }
        />
      </label>
      <button className="btn primary" onClick={create} disabled={busy}>
        {busy ? t("creating") : t("createGame")}
      </button>
    </div>
  );
}
