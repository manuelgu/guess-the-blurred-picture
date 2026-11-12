import QRCode from "qrcode";
import { useEffect, useState, type ReactNode } from "react";
import { REVEAL_MODES, type PlayerView, type RevealModeSetting } from "../shared/types";
import { useI18n } from "./i18n";

export function QR({ value, size = 280, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M" })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);
  return src ? (
    <img className={`qr ${className ?? ""}`} src={src} width={size} height={size} alt="" />
  ) : (
    <div className="qr" style={{ width: size, height: size }} />
  );
}

export function sortedPlayers(players: PlayerView[]) {
  return [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

/** Rank with ties: 10, 8, 8, 5 → 1, 2, 2, 4 */
export function ranks(players: PlayerView[]): Map<string, number> {
  const sorted = sortedPlayers(players);
  const out = new Map<string, number>();
  sorted.forEach((p, i) => out.set(p.id, i > 0 && sorted[i - 1].score === p.score ? out.get(sorted[i - 1].id)! : i + 1));
  return out;
}

/** Two-tap confirm state that disarms itself after a moment, so a stray tap much later can't confirm. */
export function useArmed<T>(ms = 3000): [T | null, (v: T | null) => void] {
  const [armed, setArmed] = useState<T | null>(null);
  useEffect(() => {
    if (armed === null) return;
    const id = setTimeout(() => setArmed(null), ms);
    return () => clearTimeout(id);
  }, [armed, ms]);
  return [armed, setArmed];
}

export function Centered({ children }: { children: ReactNode }) {
  return <div className="centered">{children}</div>;
}

export function ModeSelect({
  value,
  onChange,
  allowDefault,
}: {
  value: RevealModeSetting | undefined;
  onChange: (v: RevealModeSetting | undefined) => void;
  allowDefault?: boolean;
}) {
  const { t } = useI18n();
  const modes: RevealModeSetting[] = ["random", ...REVEAL_MODES];
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value || undefined) as RevealModeSetting | undefined)}
    >
      {allowDefault && <option value="">{t("deckDefault")}</option>}
      {modes.map((m) => (
        <option key={m} value={m}>
          {t(`mode_${m}`)}
        </option>
      ))}
    </select>
  );
}

const ERROR_KEYS = {
  "no-room": "roomGone",
  "display-auth": "notThisDisplay",
  "host-auth": "hostAuth",
  "pair-used": "pairUsed",
  "host-replaced": "hostReplaced",
  kicked: "kicked",
  "room-full": "roomFull",
} as const;

export function ErrorScreen({ code }: { code: string }) {
  const { t } = useI18n();
  const key = ERROR_KEYS[code as keyof typeof ERROR_KEYS];
  return (
    <Centered>
      <div className="card narrow">
        <p className="big-msg">{key ? t(key) : code}</p>
        <a className="btn" href="/">
          {t("home")}
        </a>
      </div>
    </Centered>
  );
}
