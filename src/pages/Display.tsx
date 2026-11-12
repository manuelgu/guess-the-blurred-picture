import { useEffect, useRef, useState } from "react";
import { ANSWER_SECONDS, pointsFor, type RoomView, type RoundView } from "../../shared/types";
import { Centered, ErrorScreen, QR, ranks, sortedPlayers } from "../components";
import { LangPicker, useI18n } from "../i18n";
import { RevealStage, answerRemaining, extrapolate } from "../reveal/RevealStage";
import { audioReady, sfx, unlockAudio } from "../sound";
import { storage } from "../storage";
import { useNow, useRoom } from "../useRoom";

type Style = "show" | "minimal";

export function Display({ code }: { code: string }) {
  const { t } = useI18n();
  const token = storage.get<string>(`display:${code}`);
  const [style, setStyle] = useState<Style>(() => storage.get<Style>("displayStyle") ?? "show");
  const [soundOn, setSoundOn] = useState(() => storage.get<boolean>("sound") ?? true);
  const [audioOk, setAudioOk] = useState(audioReady());
  const room = useRoom(code, () => ({ role: "display", token: token ?? "" }), () => {}, !!token);
  const s = room.state;
  // Rendered as its own component so its 100 ms clock only re-renders itself, not the whole display.
  const sounds = <SoundEffects s={s} receivedAt={room.receivedAt} enabled={soundOn && style === "show" && audioOk} />;

  if (!token) return <ErrorScreen code="display-auth" />;
  if (room.status === "failed" && room.error) return <ErrorScreen code={room.error} />;
  if (!s)
    return (
      <>
        {sounds}
        <Centered>{t("connecting")}</Centered>
      </>
    );

  const setStyleSaved = (v: Style) => {
    setStyle(v);
    storage.set("displayStyle", v);
  };
  const setSoundSaved = (v: boolean) => {
    setSoundOn(v);
    storage.set("sound", v);
    if (v) unlockAudio().then(setAudioOk);
  };

  return (
    <div
      className={`display style-${style}`}
      onClick={() => !audioOk && unlockAudio().then(setAudioOk)}
    >
      {sounds}
      {!s.hostPaired && s.pairToken ? (
        <PairScreen code={code} pairToken={s.pairToken} />
      ) : s.phase === "lobby" ? (
        <Lobby s={s} />
      ) : s.phase === "playing" && s.round ? (
        <Stage s={s} round={s.round} receivedAt={room.receivedAt} style={style} />
      ) : (
        <Podium s={s} />
      )}

      <DisplayMenu
        style={style}
        setStyle={setStyleSaved}
        soundOn={soundOn}
        setSoundOn={setSoundSaved}
        onRepair={() => room.send({ t: "repair" })}
      />
      {style === "show" && soundOn && !audioOk && <div className="sound-hint">🔇 {t("enableSound")}</div>}
      {room.status === "reconnecting" && <div className="conn-banner">{t("reconnecting")}</div>}
    </div>
  );
}

// ---------- Sound effects driven by server events ----------

function SoundEffects({ s, receivedAt, enabled }: { s: RoomView | null; receivedAt: number; enabled: boolean }) {
  useSoundEffects(s, receivedAt, enabled);
  return null;
}

function useSoundEffects(s: RoomView | null, receivedAt: number, enabled: boolean) {
  const lastEventId = useRef<number | null>(null);
  const lastTick = useRef<string>("");
  const now = useNow(enabled && s?.phase === "playing", 100);

  const hasState = s !== null;
  useEffect(() => {
    if (!s) return;
    const ev = s.lastEvent;
    if (lastEventId.current === null) {
      lastEventId.current = ev?.id ?? 0; // don't replay the event we joined on
      return;
    }
    if (!ev || ev.id === lastEventId.current) return;
    lastEventId.current = ev.id;
    if (!enabled) return;
    const play: Partial<Record<typeof ev.kind, () => void>> = {
      buzz: sfx.buzz,
      correct: sfx.correct,
      wrong: sfx.wrong,
      reveal: sfx.reveal,
      joined: sfx.join,
      finished: sfx.fanfare,
    };
    play[ev.kind]?.();
  }, [hasState, s?.lastEvent?.id, enabled]);

  // Countdown beeps (3-2-1-go) and answer ticks.
  useEffect(() => {
    // Seen the lobby / podium: the next round's first countdown beep is live, not a mid-round join.
    if (s && !s.round) lastTick.current = "idle";
    if (!enabled || !s?.round) return;
    const r = s.round;
    const el = extrapolate(r.elapsedMs, r.running, receivedAt, now);
    let key = "";
    let sound: (() => void) | null = null;
    if (r.status === "revealing" && el < 0) {
      key = `cd:${r.index}:${Math.ceil(-el / 1000)}`;
      sound = sfx.start;
    } else if (r.status === "revealing" && el < 150 && r.running) {
      key = `go:${r.index}`;
      sound = sfx.go;
    } else if (r.status === "answering") {
      const rem = answerRemaining(r.answerRemainingMs, receivedAt, now);
      if (rem !== null && rem > 0) {
        key = `tick:${r.index}:${r.queue[0]}:${Math.ceil(rem / 1000)}`;
        sound = sfx.tick;
      }
    }
    if (key && key !== lastTick.current) {
      const first = lastTick.current === "";
      lastTick.current = key;
      if (!first) sound?.();
    }
  }, [now, enabled, s, receivedAt]);
}

// ---------- Screens ----------

function PairScreen({ code, pairToken }: { code: string; pairToken: string }) {
  const { t } = useI18n();
  const url = `${location.origin}/host/${code}#${pairToken}`;
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);
  // The link is only copied, never shown, so it can't leak onto the shared TV screen.
  const copy = () =>
    navigator.clipboard
      .writeText(url)
      .then(() => setCopied(true))
      .catch(() => {});
  return (
    <Centered>
      <div className="pair-card">
        <div className="eyebrow">🔒 {t("pairTitle")}</div>
        <QR value={url} size={300} />
        <p className="pair-body">{t("pairBody")}</p>
        <p className="muted small">{t("pairOnce")}</p>
        <button className="btn small" onClick={copy}>
          🔗 {copied ? t("copied") : t("copyHostLink")}
        </button>
      </div>
      <LangPicker className="corner-bl" />
    </Centered>
  );
}

function JoinBlock({ code, size = 260 }: { code: string; size?: number }) {
  const { t } = useI18n();
  const url = `${location.origin}/join/${code}`;
  return (
    <div className="join-block">
      <QR value={url} size={size} />
      <div>
        <div className="muted">{t("joinAt", { url: `${location.host}/join` })}</div>
        <div className="room-code">{code}</div>
      </div>
    </div>
  );
}

function Lobby({ s }: { s: RoomView }) {
  const { t } = useI18n();
  return (
    <div className="lobby">
      <div className="lobby-left">
        <div className="eyebrow">{s.deckTitle}</div>
        <h1 className="display-title">{t("joinTitle")}</h1>
        <JoinBlock code={s.code} size={300} />
        <HostStatus s={s} />
      </div>
      <div className="lobby-right">
        <h2>
          {t("players")} <span className="count">{s.players.length}</span>
        </h2>
        {s.players.length === 0 ? (
          <p className="muted pulse">{t("waitingForPlayers")}</p>
        ) : (
          <div className="player-chips">
            {s.players.map((p) => (
              <div key={p.id} className={`chip pop-in ${p.connected ? "" : "offline"}`}>
                {p.name}
              </div>
            ))}
          </div>
        )}
        {s.players.length > 0 && <p className="muted pulse">{t("waitingForHost")}</p>}
      </div>
    </div>
  );
}

function HostStatus({ s }: { s: RoomView }) {
  const { t } = useI18n();
  return (
    <div className={`host-status ${s.hostConnected ? "ok" : "warn"}`}>
      <span className="dot" /> {s.hostConnected ? t("hostConnected") : t("hostDisconnected")}
    </div>
  );
}

function Stage({ s, round: r, receivedAt, style }: { s: RoomView; round: RoundView; receivedAt: number; style: Style }) {
  const { t } = useI18n();
  // Only tick while the reveal or answer timer is moving (extrapolate clamps a stale clock).
  const now = useNow(r.running || r.status === "answering", 100);
  const elapsed = extrapolate(r.elapsedMs, r.running, receivedAt, now);
  const progress = Math.max(0, Math.min(1, elapsed / r.durationMs));
  const worth = pointsFor(progress);
  const over = r.status === "solved" || r.status === "revealed";
  const answeringId = r.status === "answering" ? r.queue[0] : null;
  const answering = s.players.find((p) => p.id === answeringId);
  const remaining = answerRemaining(r.answerRemainingMs, receivedAt, now);
  const winner = s.players.find((p) => p.id === r.winnerId);
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="stage">
      <header className="stage-top">
        <div className="stage-count">{t("pictureOf", { i: r.index + 1, n: r.total })}</div>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          <div className="progress-marks">
            <span>3</span>
            <span>2</span>
            <span>1</span>
          </div>
        </div>
        {!over && <div className={`worth worth-${worth}`}>{t("worth", { n: t("pts", { n: worth }) })}</div>}
        <div className="code-chip">{s.code}</div>
      </header>

      <div className="stage-main">
        <div className={`picture-wrap ${r.status}`}>
          <RevealStage
            key={`${r.index}:${r.imageUrl}`}
            imageUrl={r.imageUrl}
            mode={r.mode}
            seed={r.seed}
            durationMs={r.durationMs}
            getElapsed={() => extrapolate(r.elapsedMs, r.running, receivedAt)}
          />

          {r.status === "revealing" && elapsed < 0 && (
            <div className="overlay countdown">
              <div key={Math.ceil(-elapsed / 1000)} className="countdown-num">
                {Math.ceil(-elapsed / 1000)}
              </div>
            </div>
          )}

          {r.status === "paused" && <div className="badge-center">⏸ {t("paused")}</div>}
          {r.status === "revealing" && progress >= 1 && <div className="badge-corner">{t("fullyRevealed")}</div>}

          {answering && (
            <div className="answer-banner">
              <TimerRing remainingMs={remaining ?? 0} totalMs={ANSWER_SECONDS * 1000} />
              <div>
                <div className="answering-name">{answering.name}</div>
                <div className="answering-label">
                  {remaining !== null && remaining <= 0 ? t("timeUp") : t("isAnswering")}
                </div>
                {r.queue.length > 1 && (
                  <div className="queue-line">
                    {t("nextInLine")}: {r.queue.slice(1).map(nameOf).join(" · ")}
                  </div>
                )}
              </div>
            </div>
          )}

          {over && (
            <div className={`result-banner ${r.status}`}>
              <div className="result-answer">{r.answer}</div>
              <div className="result-sub">
                {r.status === "solved" && winner
                  ? `${t("gotIt", { name: winner.name })}  +${r.pointsAwarded}`
                  : t("nobodyGotIt")}
              </div>
              {r.credit && <div className="credit">📷 {r.credit}</div>}
            </div>
          )}
        </div>

        <Scoreboard s={s} round={r} showJoin={style === "show"} />
      </div>

      {!s.hostConnected && <div className="host-warning">⚠ {t("hostDisconnected")}</div>}
    </div>
  );
}

function TimerRing({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const frac = Math.max(0, Math.min(1, remainingMs / totalMs));
  const c = 2 * Math.PI * 44;
  return (
    <div className={`timer-ring ${remainingMs <= 0 ? "done" : ""}`}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" className="track" />
        <circle
          cx="50"
          cy="50"
          r="44"
          className="bar"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span>{Math.max(0, Math.ceil(remainingMs / 1000))}</span>
    </div>
  );
}

function Scoreboard({ s, round, showJoin }: { s: RoomView; round: RoundView; showJoin: boolean }) {
  const { t } = useI18n();
  const rk = ranks(s.players);
  return (
    <aside className="scoreboard">
      <h3>{t("scores")}</h3>
      <ol>
        {sortedPlayers(s.players).map((p) => {
          const cls = [
            round.queue[0] === p.id && round.status === "answering" ? "answering" : "",
            round.queue.slice(1).includes(p.id) ? "queued" : "",
            round.lockedOut.includes(p.id) ? "locked" : "",
            round.winnerId === p.id ? "winner" : "",
            p.connected ? "" : "offline",
          ].join(" ");
          return (
            <li key={p.id} className={cls}>
              <span className="rank">{rk.get(p.id)}</span>
              <span className="name">{p.name}</span>
              <span key={p.score} className="score bump">
                {p.score}
              </span>
            </li>
          );
        })}
      </ol>
      {showJoin && (
        <div className="mini-join">
          <QR value={`${location.origin}/join/${s.code}`} size={72} />
          <span>
            {location.host}/join
            <br />
            <strong className="code-chip">{s.code}</strong>
          </span>
        </div>
      )}
    </aside>
  );
}

function Podium({ s }: { s: RoomView }) {
  const { t } = useI18n();
  const sorted = sortedPlayers(s.players);
  const rk = ranks(s.players);
  const top = sorted.slice(0, 3);
  const order = [top[1], top[0], top[2]]; // 2nd, 1st, 3rd
  return (
    <div className="podium-screen">
      <div className="eyebrow">{t("gameOver")}</div>
      <h1 className="display-title">{t("finalScores")}</h1>
      <div className="podium">
        {order.map((p, i) =>
          p ? (
            <div key={p.id} className={`podium-col place-${rk.get(p.id)}`} style={{ animationDelay: `${[0.4, 0.8, 0][i]}s` }}>
              <div className="podium-name">{p.name}</div>
              <div className="podium-score">{p.score}</div>
              <div className="podium-block">{rk.get(p.id)}</div>
            </div>
          ) : (
            <div key={i} className="podium-col empty" />
          ),
        )}
      </div>
      {sorted.length > 3 && (
        <ol className="rest-list">
          {sorted.slice(3).map((p) => (
            <li key={p.id}>
              <span className="rank">{rk.get(p.id)}</span>
              <span className="name">{p.name}</span>
              <span className="score">{p.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function DisplayMenu({
  style,
  setStyle,
  soundOn,
  setSoundOn,
  onRepair,
}: {
  style: Style;
  setStyle: (s: Style) => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
  onRepair: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [confirmRepair, setConfirmRepair] = useState(false);
  return (
    <div className="display-menu">
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menu">
        ⚙
      </button>
      {open && (
        <div className="menu-pop" onClick={(e) => e.stopPropagation()}>
          <div className="seg">
            <button className={style === "show" ? "active" : ""} onClick={() => setStyle("show")}>
              {t("styleShow")}
            </button>
            <button className={style === "minimal" ? "active" : ""} onClick={() => setStyle("minimal")}>
              {t("styleMinimal")}
            </button>
          </div>
          <button className="menu-item" onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? `🔊 ${t("soundOn")}` : `🔇 ${t("soundOff")}`}
          </button>
          <button
            className="menu-item"
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
          >
            ⛶ {t("fullscreen")}
          </button>
          <LangPicker />
          {!confirmRepair ? (
            <button className="menu-item" onClick={() => setConfirmRepair(true)}>
              🔑 {t("repairHost")}
            </button>
          ) : (
            <div className="repair-confirm">
              <p>⚠ {t("repairWarning")}</p>
              <div className="row">
                <button className="btn small" onClick={() => setConfirmRepair(false)}>
                  {t("cancel")}
                </button>
                <button
                  className="btn small danger"
                  onClick={() => {
                    onRepair();
                    setConfirmRepair(false);
                    setOpen(false);
                  }}
                >
                  {t("repairConfirm")}
                </button>
              </div>
            </div>
          )}
          <a className="menu-item" href="/">
            ⌂ {t("home")}
          </a>
        </div>
      )}
    </div>
  );
}
