import { useEffect, useState } from "react";
import { emptyDeck } from "../../shared/types";
import { api, type PackInfo } from "../api";
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

  const usePack = async (pack: PackInfo) => {
    setBusyPack(pack.id);
    setError(null);
    try {
      const { id, key, title, count } = await api.usePack(pack.id, lang);
      savedDecks.upsert({ id, key, title, count });
      setDecks(savedDecks.list());
    } catch (e) {
      setError(String((e as Error).message));
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
                <button key={p.id} className="pack" disabled={!!busyPack} onClick={() => usePack(p)}>
                  <span className="pack-emoji">{p.emoji}</span>
                  <strong>{p.title[lang] ?? p.title.en}</strong>
                  <span className="muted small">
                    {busyPack === p.id ? t("preparingPack") : t("pictures", { n: p.count })}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function PlaySetup({ deck, onError }: { deck: SavedDeck; onError: (e: string) => void }) {
  const { t } = useI18n();
  const [shuffle, setShuffle] = useState(() => storage.get<boolean>("shuffle") ?? true);
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    try {
      storage.set("shuffle", shuffle);
      const { code, displayToken } = await api.createRoom(deck.id, deck.key, shuffle);
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
      <button className="btn primary" onClick={create} disabled={busy}>
        {busy ? t("creating") : t("createGame")}
      </button>
    </div>
  );
}
