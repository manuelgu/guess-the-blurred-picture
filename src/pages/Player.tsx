import { useEffect, useRef, useState } from "react";
import type { RoomView, RoundView } from "../../shared/types";
import { Centered, ErrorScreen, ranks } from "../components";
import { LangPicker, useI18n } from "../i18n";
import { navigate } from "../router";
import { answerRemaining, extrapolate } from "../reveal/RevealStage";
import { storage } from "../storage";
import { useNow, useRoom, useWakeLock } from "../useRoom";

interface PlayerCreds {
  pid: string;
  ptoken: string;
}

export function JoinForm({ initialCode = "" }: { initialCode?: string }) {
  const { t } = useI18n();
  const [code, setCode] = useState(initialCode);
  return (
    <form
      className="join-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === 4) navigate(`/join/${code}`);
      }}
    >
      <input
        className="code-input"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
        placeholder="ABCD"
        aria-label={t("roomCode")}
        autoCapitalize="characters"
        autoComplete="off"
        inputMode="text"
      />
      <button className="btn primary" disabled={code.length !== 4}>
        {t("join")}
      </button>
    </form>
  );
}

export function Player({ code }: { code: string }) {
  const { t } = useI18n();
  const credsKey = `player:${code}`;
  const [creds, setCreds] = useState(() => storage.get<PlayerCreds>(credsKey));
  const [name, setName] = useState(() => storage.get<string>("lastName") ?? "");
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const enabled = !!creds || !!submittedName;

  const room = useRoom(
    code,
    (): Record<string, string> => {
      const c = storage.get<PlayerCreds>(credsKey);
      return c ? { role: "player", pid: c.pid, ptoken: c.ptoken, name: submittedName ?? "" } : { role: "player", name: submittedName ?? "" };
    },
    (msg) => {
      if (msg.playerId && msg.token) {
        const c = { pid: msg.playerId, ptoken: msg.token };
        storage.set(credsKey, c);
        setCreds(c);
      }
    },
    enabled,
  );
  useWakeLock(room.state?.phase === "playing");

  // Stale credentials (e.g. an old room that reused this code): fall back to the name form.
  useEffect(() => {
    if (room.status === "failed" && room.error === "name-required") {
      storage.remove(credsKey);
      setCreds(null);
      setSubmittedName(null);
    } else if (room.status === "failed" && room.error === "no-room") {
      storage.remove(credsKey);
    }
  }, [room.status, room.error, credsKey]);

  if (room.status === "failed" && room.error && room.error !== "name-required") {
    // Keep credentials after a kick: on reload they make the server answer "kicked" again
    // instead of showing a fresh name form that would let the player rejoin.
    return <ErrorScreen code={room.error} />;
  }

  if (!enabled) {
    return (
      <div className="phone">
        <Centered>
          <form
            className="card narrow stack"
            onSubmit={(e) => {
              e.preventDefault();
              const n = name.trim();
              if (!n) return;
              storage.set("lastName", n);
              // Pick our own identity before connecting, so a duplicate connect can't create a ghost player.
              if (!storage.get<PlayerCreds>(credsKey)) {
                const hex = () => crypto.randomUUID().replace(/-/g, "");
                storage.set(credsKey, { pid: hex().slice(0, 12), ptoken: hex() + hex() });
              }
              setSubmittedName(n);
            }}
          >
            <div className="eyebrow">
              {t("roomCode")}: <strong>{code}</strong>
            </div>
            <label className="field">
              <span>{t("yourName")}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                autoFocus
                maxLength={24}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                enterKeyHint="go"
              />
            </label>
            <button className="btn primary huge" disabled={!name.trim()}>
              {t("joinRoom")}
            </button>
          </form>
          <LangPicker />
        </Centered>
      </div>
    );
  }

  const s = room.state;
  if (!s || !s.you) return <Centered>{t("connecting")}</Centered>;
  return <PlayerGame s={s} receivedAt={room.receivedAt} send={room.send} reconnecting={room.status === "reconnecting"} />;
}

function PlayerGame({
  s,
  receivedAt,
  send,
  reconnecting,
}: {
  s: RoomView;
  receivedAt: number;
  send: ReturnType<typeof useRoom>["send"];
  reconnecting: boolean;
}) {
  const { t } = useI18n();
  const me = s.players.find((p) => p.id === s.you!.id);
  const rk = ranks(s.players);

  return (
    <div className="phone player">
      <header className="phone-top">
        <span className="me-name">{s.you!.name}</span>
        <span className="me-score">
          {me?.score ?? 0} <small>{t("pts", { n: "" }).trim()}</small>
          {s.players.length > 1 && <small className="muted"> · {t("place", { n: rk.get(s.you!.id) ?? "-" })}</small>}
        </span>
      </header>
      {reconnecting && <div className="conn-banner">{t("reconnecting")}</div>}

      {s.phase === "lobby" && (
        <Centered>
          <div className="big-emoji">🎉</div>
          <h2>{t("youAreIn")}</h2>
          <p className="muted">{t("waitingForHost")}</p>
        </Centered>
      )}
      {s.phase === "playing" && s.round && <Buzzer s={s} r={s.round} receivedAt={receivedAt} send={send} />}
      {s.phase === "finished" && (
        <Centered>
          <div className="big-emoji">{rk.get(s.you!.id) === 1 ? "🏆" : "🎬"}</div>
          <h2>{t("gameOver")}</h2>
          <p className="huge-num">{t("place", { n: rk.get(s.you!.id) ?? "-" })}</p>
          <a className="btn" href="/">
            {t("home")}
          </a>
        </Centered>
      )}
    </div>
  );
}

function Buzzer({
  s,
  r,
  receivedAt,
  send,
}: {
  s: RoomView;
  r: RoundView;
  receivedAt: number;
  send: ReturnType<typeof useRoom>["send"];
}) {
  const { t } = useI18n();
  const myId = s.you!.id;
  const now = useNow(r.status === "revealing" || r.status === "answering", 100);
  const elapsed = extrapolate(r.elapsedMs, r.running, receivedAt, now);
  const [pending, setPending] = useState(false);
  const lastSeen = useRef(r);

  // Clear the optimistic "buzzed" state when the server answers.
  useEffect(() => {
    if (lastSeen.current !== r) setPending(false);
    lastSeen.current = r;
  }, [r]);
  // ...or give up after a moment if the buzz was rejected (no state change).
  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => setPending(false), 1500);
    return () => clearTimeout(id);
  }, [pending]);

  const myPos = r.queue.indexOf(myId);
  const locked = r.lockedOut.includes(myId);
  const remaining = answerRemaining(r.answerRemainingMs, receivedAt, now);

  // Vibrate when it becomes my turn.
  const wasMyTurn = useRef(false);
  useEffect(() => {
    const myTurn = myPos === 0 && r.status === "answering";
    if (myTurn && !wasMyTurn.current) navigator.vibrate?.([80, 60, 80]);
    wasMyTurn.current = myTurn;
  }, [myPos, r.status]);

  const ev = s.lastEvent;
  const justWrong = ev?.kind === "wrong" && ev.playerId === myId && locked;

  let content: React.ReactNode;
  if (r.status === "solved") {
    const winner = s.players.find((p) => p.id === r.winnerId);
    content =
      r.winnerId === myId ? (
        <div className="state-msg good">{t("youGotIt", { n: r.pointsAwarded ?? 0 })}</div>
      ) : (
        <div className="state-msg">
          {t("someoneGotIt", { name: winner?.name ?? "?" })}
          <div className="muted small">{t("waitingNext")}</div>
        </div>
      );
  } else if (r.status === "revealed") {
    content = (
      <div className="state-msg">
        {t("nobodyGotIt")}
        <div className="muted small">{t("waitingNext")}</div>
      </div>
    );
  } else if (myPos === 0 && r.status === "answering") {
    content = (
      <div className="state-msg your-turn">
        <div className="turn-title">{t("yourTurn")}</div>
        <div className="turn-timer">{remaining !== null && remaining > 0 ? Math.ceil(remaining / 1000) : "0"}</div>
      </div>
    );
  } else if (myPos > 0) {
    content = <div className="state-msg queued">{t("inLine", { n: myPos + 1 })}</div>;
  } else if (locked) {
    content = (
      <div className={`state-msg bad ${justWrong ? "shake" : ""}`}>
        {justWrong && <div className="turn-title">{t("youWereWrong")}</div>}
        {t("lockedOut")}
      </div>
    );
  } else {
    const countdown = r.status === "revealing" && elapsed < 0;
    const canBuzz = (r.status === "revealing" && !countdown) || r.status === "answering";
    content = (
      <div className="buzz-area">
        <button
          className={`buzz-btn ${pending ? "pressed" : ""}`}
          disabled={!canBuzz || pending}
          onPointerDown={(e) => {
            e.preventDefault();
            if (!canBuzz || pending) return;
            navigator.vibrate?.(40);
            setPending(true);
            send({ t: "buzz" });
          }}
        >
          {pending
            ? t("buzzed")
            : countdown
              ? Math.ceil(-elapsed / 1000)
              : r.status === "paused"
                ? "⏸"
                : t("buzz")}
        </button>
        <div className="muted buzz-hint">
          {countdown ? t("getReady") : r.status === "paused" ? t("paused") : r.status === "answering" ? t("buzzToQueue") : ""}
        </div>
      </div>
    );
  }

  return <div className="buzzer-screen">{content}</div>;
}
