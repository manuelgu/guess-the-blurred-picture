import { useState } from "react";
import { pointsFor, type RoomView, type RoundView } from "../../shared/types";
import { Centered, ErrorScreen, ranks, sortedPlayers, useArmed } from "../components";
import { LangPicker, useI18n } from "../i18n";
import { answerRemaining, extrapolate } from "../reveal/RevealStage";
import { storage } from "../storage";
import { useNow, useRoom, useWakeLock } from "../useRoom";

/** Random per page load: lets this phone (and only this phone) retry a pair token it just redeemed. */
const DEVICE_ID = crypto.randomUUID();

export function Host({ code }: { code: string }) {
  const { t } = useI18n();
  // A fresh pair token arrives in the URL hash (from the QR). Use it once, then rely on the stored host token.
  const [pairToken, setPairToken] = useState(() => location.hash.slice(1) || null);
  const room = useRoom(
    code,
    (): Record<string, string> =>
      pairToken ? { role: "host", pair: pairToken, device: DEVICE_ID } : { role: "host", token: storage.get<string>(`host:${code}`) ?? "" },
    (msg) => {
      if (msg.token) storage.set(`host:${code}`, msg.token);
      if (pairToken) {
        history.replaceState(null, "", location.pathname);
        setPairToken(null);
      }
    },
  );
  useWakeLock(room.state?.phase === "playing");
  const s = room.state;

  if (room.status === "failed" && room.error) return <ErrorScreen code={room.error} />;
  if (!s) return <Centered>{t("connecting")}</Centered>;

  return (
    <div className="phone host">
      <header className="phone-top">
        <span className="badge-host">🔒 {t("youAreHost")}</span>
        <span className="code-chip small">{s.code}</span>
      </header>
      {room.status === "reconnecting" && <div className="conn-banner">{t("reconnecting")}</div>}

      {s.phase === "lobby" && <HostLobby s={s} send={room.send} />}
      {s.phase === "playing" && s.round && (
        <HostRound s={s} r={s.round} receivedAt={room.receivedAt} send={room.send} />
      )}
      {s.phase === "finished" && (
        <div className="stack">
          <h2>{t("finalScores")}</h2>
          <ScoreList s={s} send={room.send} editable={false} />
          <a className="btn" href="/">
            {t("home")}
          </a>
        </div>
      )}
      {s.phase !== "finished" && <EndGame send={room.send} visible={s.phase === "playing"} />}
      <LangPicker className="phone-lang" />
    </div>
  );
}

type Send = ReturnType<typeof useRoom>["send"];

function HostLobby({ s, send }: { s: RoomView; send: Send }) {
  const { t } = useI18n();
  return (
    <div className="stack">
      <p className="muted small">{t("hostOnlyYou")}</p>
      <h2>
        {t("players")} <span className="count">{s.players.length}</span>
      </h2>
      {s.players.length === 0 ? <p className="muted">{t("noPlayersYet")}</p> : <ScoreList s={s} send={send} editable />}
      {s.nextAnswer && (
        <div className="peek">
          {t("firstUp")}: <strong>{s.nextAnswer}</strong>
        </div>
      )}
      <button className="btn primary huge" onClick={() => send({ t: "start" })}>
        ▶ {t("startGame")}
      </button>
    </div>
  );
}

function HostRound({ s, r, receivedAt, send }: { s: RoomView; r: RoundView; receivedAt: number; send: Send }) {
  const { t } = useI18n();
  const now = useNow(r.running || r.status === "answering", 100);
  const elapsed = extrapolate(r.elapsedMs, r.running, receivedAt, now);
  const progress = Math.max(0, Math.min(1, elapsed / r.durationMs));
  const answering = r.status === "answering" ? s.players.find((p) => p.id === r.queue[0]) : undefined;
  const remaining = answerRemaining(r.answerRemainingMs, receivedAt, now);
  const over = r.status === "solved" || r.status === "revealed";
  const isLast = r.index + 1 >= r.total;
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="stack">
      <div className="host-picture">
        <img src={r.imageUrl} alt="" />
        <div>
          <div className="muted small">{t("pictureOf", { i: r.index + 1, n: r.total })}</div>
          <div className="host-answer">{r.answer}</div>
          {!over && <div className="muted small">{t("pointsAtStake", { n: pointsFor(progress) })}</div>}
        </div>
      </div>
      <div className="progress thin">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {answering ? (
        <div className="judge-card">
          <div className="judge-name">{answering.name}</div>
          <div className="muted">
            {remaining !== null && remaining > 0 ? `${Math.ceil(remaining / 1000)}s` : t("timeUp")}
          </div>
          <div className="judge-buttons">
            <button className="btn wrong huge" onClick={() => send({ t: "judge", correct: false, playerId: answering.id })}>
              ✗ {t("wrong")} <small>−1</small>
            </button>
            <button className="btn correct huge" onClick={() => send({ t: "judge", correct: true, playerId: answering.id })}>
              ✓ {t("correct")} <small>+{pointsFor(r.elapsedMs / r.durationMs)}</small>
            </button>
          </div>
          {r.queue.length > 1 && (
            <div className="muted small">
              {t("nextInLine")}: {r.queue.slice(1).map(nameOf).join(" · ")}
            </div>
          )}
        </div>
      ) : over ? (
        <div className="stack">
          <div className={`result-pill ${r.status}`}>
            {r.status === "solved" ? `✓ ${t("gotIt", { name: nameOf(r.winnerId!) })} +${r.pointsAwarded}` : t("nobodyGotIt")}
          </div>
          {!isLast && s.nextAnswer && (
            <div className="peek">
              {t("nextUp")}: <strong>{s.nextAnswer}</strong>
            </div>
          )}
          <button className="btn primary huge" onClick={() => send({ t: "next", from: r.index })}>
            {isLast ? `🏆 ${t("finishGame")}` : `▶ ${t("nextPicture")}`}
          </button>
        </div>
      ) : (
        <div className="control-grid">
          {r.status === "paused" ? (
            <button className="btn primary" onClick={() => send({ t: "resume" })}>
              ▶ {t("resume")}
            </button>
          ) : (
            <button className="btn" onClick={() => send({ t: "pause" })} disabled={elapsed < 0}>
              ⏸ {t("pause")}
            </button>
          )}
          <button className="btn" onClick={() => send({ t: "reveal" })}>
            👁 {t("revealAnswer")}
          </button>
          <button className="btn" onClick={() => send({ t: "next", from: r.index })}>
            ⏭ {isLast ? t("finishGame") : t("skip")}
          </button>
        </div>
      )}

      <h3>{t("scores")}</h3>
      <ScoreList s={s} send={send} editable />
    </div>
  );
}

function ScoreList({ s, send, editable }: { s: RoomView; send: Send; editable: boolean }) {
  const { t } = useI18n();
  const rk = ranks(s.players);
  const [kickArmed, setKickArmed] = useArmed<string>();
  return (
    <ul className="score-list">
      {sortedPlayers(s.players).map((p) => (
        <li key={p.id} className={p.connected ? "" : "offline"}>
          <span className="rank">{rk.get(p.id)}</span>
          <span className="name">{p.name}</span>
          {editable && (
            <>
              <button className="mini" onClick={() => send({ t: "adjust", playerId: p.id, delta: -1 })}>
                −
              </button>
              <span className="score">{p.score}</span>
              <button className="mini" onClick={() => send({ t: "adjust", playerId: p.id, delta: 1 })}>
                +
              </button>
              <button
                className={`mini ${kickArmed === p.id ? "danger" : ""}`}
                onClick={() => {
                  if (kickArmed === p.id) {
                    send({ t: "kick", playerId: p.id });
                    setKickArmed(null);
                  } else setKickArmed(p.id);
                }}
                title={t("kick")}
              >
                {kickArmed === p.id ? t("kick") : "✕"}
              </button>
            </>
          )}
          {!editable && <span className="score">{p.score}</span>}
        </li>
      ))}
    </ul>
  );
}

function EndGame({ send, visible }: { send: Send; visible: boolean }) {
  const { t } = useI18n();
  const [armed, setArmed] = useArmed<true>();
  if (!visible) return null;
  return (
    <button
      className={`btn ghost small end-game ${armed ? "danger" : ""}`}
      onClick={() => {
        if (armed) send({ t: "end" });
        setArmed(armed ? null : true);
      }}
    >
      {armed ? t("endGameConfirm") : t("endGame")}
    </button>
  );
}
