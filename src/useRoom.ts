import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, RoomView, ServerMessage } from "../shared/types";

const PING_MS = 20000;

/** Errors after which reconnecting makes no sense. */
const FATAL = new Set([
  "no-room",
  "display-auth",
  "host-auth",
  "pair-used",
  "host-replaced",
  "kicked",
  "name-required",
  "room-full",
  "bad-role",
]);

export interface RoomConnection {
  state: RoomView | null;
  /** performance.now() when `state` arrived — used to extrapolate timers. */
  receivedAt: number;
  status: "connecting" | "open" | "reconnecting" | "failed";
  error: string | null;
  send: (msg: ClientMessage) => void;
}

/**
 * Connects to a room. `params` is called on every (re)connect so callers can switch
 * from a one-time credential (pair token, name) to a long-lived one.
 * Pass `enabled=false` to hold off (e.g. until the player typed a name).
 */
export function useRoom(
  code: string,
  params: () => Record<string, string>,
  onWelcome: (msg: Extract<ServerMessage, { t: "welcome" }>) => void,
  enabled = true,
): RoomConnection {
  const [state, setState] = useState<RoomView | null>(null);
  const [receivedAt, setReceivedAt] = useState(0);
  const [status, setStatus] = useState<RoomConnection["status"]>("connecting");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const paramsRef = useRef(params);
  const welcomeRef = useRef(onWelcome);
  paramsRef.current = params;
  welcomeRef.current = onWelcome;

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let fatal = false;
    /** performance.now() of the last message (state or pong) on the current socket. */
    let lastSeen = 0;

    /**
     * Abandon a socket that looks dead (a locked phone can leave it "OPEN" with nothing behind it)
     * and reconnect right away instead of waiting for a close event that may take minutes.
     */
    const drop = (ws: WebSocket) => {
      if (wsRef.current !== ws || stopped || fatal) return;
      wsRef.current = null; // its eventual close event is now ignored
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      clearTimeout(retryTimer);
      setStatus("reconnecting");
      connect();
    };

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      const qs = new URLSearchParams(paramsRef.current()).toString();
      const ws = new WebSocket(`${proto}//${location.host}/api/rooms/${code}/ws?${qs}`);
      wsRef.current = ws;
      lastSeen = performance.now();
      // Per-connection, so a late close event from a replaced socket can't clear the new socket's pings.
      let pingTimer: ReturnType<typeof setInterval> | undefined;
      ws.onopen = () => {
        attempt = 0;
        setStatus("open");
        pingTimer = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) return;
          // Two pings without any answer: the connection is gone even though the browser hasn't noticed.
          if (performance.now() - lastSeen > PING_MS * 2 + 5000) {
            clearInterval(pingTimer);
            drop(ws);
            return;
          }
          ws.send('{"t":"ping"}');
        }, PING_MS);
      };
      ws.onmessage = (ev) => {
        if (wsRef.current !== ws) return; // abandoned socket that turned out to be alive
        lastSeen = performance.now();
        const msg = JSON.parse(ev.data) as ServerMessage;
        if (msg.t === "state") {
          setState(msg.state);
          setReceivedAt(performance.now());
          setError(null);
        } else if (msg.t === "welcome") {
          welcomeRef.current(msg);
        } else if (msg.t === "error") {
          setError(msg.code);
          if (FATAL.has(msg.code)) fatal = true;
        }
      };
      ws.onclose = () => {
        clearInterval(pingTimer);
        // A socket that was already replaced (e.g. by the visibility reconnect) must not schedule another one.
        if (stopped || wsRef.current !== ws) return;
        if (fatal) {
          setStatus("failed");
          return;
        }
        setStatus("reconnecting");
        attempt += 1;
        retryTimer = setTimeout(connect, Math.min(8000, 500 * 2 ** Math.min(attempt, 4)));
      };
    };
    connect();

    // Phones kill sockets when the screen locks; reconnect promptly when back.
    const onVisible = () => {
      if (document.visibilityState !== "visible" || fatal) return;
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.CLOSED) {
        clearTimeout(retryTimer);
        connect();
      } else if (ws?.readyState === WebSocket.OPEN && performance.now() - lastSeen > PING_MS + 5000) {
        // Silent for longer than a ping round: likely a dead socket left over from the lock screen.
        drop(ws);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", onVisible);
      wsRef.current?.close();
    };
  }, [code, enabled]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  return { state, receivedAt, status, error, send };
}

/** Re-render on every animation frame while `active`. Returns performance.now(). */
export function useNow(active: boolean, intervalMs = 0): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last >= intervalMs) {
        last = t;
        setNow(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, intervalMs]);
  return now;
}

/** Keep the phone screen on while playing (where supported). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = () =>
      navigator.wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => {});
    request();
    const onVisible = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
