// Pip, the host. Placeholder art until the design direction is approved; the
// mood names are the stable API, so screens can use them now.
export type Mood =
  | "idle"
  | "searching"
  | "matched"
  | "walking"
  | "thinking"
  | "cheer"
  | "oops"
  | "sleepy";

const eyes: Record<Mood, React.ReactNode> = {
  idle: <><circle cx="21" cy="33" r="2.8" /><circle cx="35" cy="33" r="2.8" /></>,
  searching: <><circle cx="23" cy="32" r="2.8" /><circle cx="37" cy="32" r="2.8" /></>,
  matched: <><path d="M18 33q3-4 6 0M32 33q3-4 6 0" strokeWidth="2.4" fill="none" stroke="currentColor" strokeLinecap="round" /></>,
  walking: <><circle cx="22" cy="33" r="2.8" /><circle cx="36" cy="33" r="2.8" /></>,
  thinking: <><circle cx="22" cy="31" r="2.8" /><circle cx="36" cy="31" r="2.8" /></>,
  cheer: <><path d="M18 33q3-4 6 0M32 33q3-4 6 0" strokeWidth="2.4" fill="none" stroke="currentColor" strokeLinecap="round" /></>,
  oops: <><circle cx="21" cy="34" r="2.6" /><circle cx="35" cy="34" r="2.6" /></>,
  sleepy: <><path d="M18 34h6M32 34h6" strokeWidth="2.4" stroke="currentColor" strokeLinecap="round" /></>,
};

const mouths: Record<Mood, string> = {
  idle: "M25 41q3 2.5 6 0",
  searching: "M27 41h4",
  matched: "M24 40q4 5 8 0",
  walking: "M25 41q3 2.5 6 0",
  thinking: "M26 42q2-1.5 4 0",
  cheer: "M23 39q5 7 10 0z",
  oops: "M25 43q3-3 6 0",
  sleepy: "M26 42h4",
};

const motion: Partial<Record<Mood, string>> = {
  searching: "animate-[pip-look_2.4s_ease-in-out_infinite]",
  walking: "animate-[pip-walk_0.9s_ease-in-out_infinite]",
  thinking: "animate-[pip-bob_1.6s_ease-in-out_infinite]",
  cheer: "animate-[pip-hop_0.9s_var(--ease-spring)_2]",
  idle: "animate-[pip-bob_3.2s_ease-in-out_infinite]",
};

export function Mascot({ mood = "idle", size = 72, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 56 64"
      width={size}
      height={(size * 64) / 56}
      className={`text-ink ${motion[mood] ?? ""} ${className}`}
      role="img"
      aria-label={`Pip looks ${mood}`}
    >
      <path d="M28 6c2-4 7-5 8-1-3 1-5 3-8 1z" fill="var(--color-accent)" />
      <path d="M28 6v6" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="28" cy="35" rx="24" ry="22" fill="var(--color-sun)" />
      <ellipse cx="28" cy="35" rx="24" ry="22" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="1.5" />
      {(mood === "matched" || mood === "cheer") && (
        <>
          <circle cx="15" cy="40" r="3" fill="var(--color-anywhere)" opacity=".35" />
          <circle cx="41" cy="40" r="3" fill="var(--color-anywhere)" opacity=".35" />
        </>
      )}
      <g fill="currentColor">{eyes[mood]}</g>
      <path d={mouths[mood]} stroke="currentColor" strokeWidth="2.2" fill={mood === "cheer" ? "currentColor" : "none"} strokeLinecap="round" />
      <path d="M19 56v6M37 56v6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      {mood === "sleepy" && <text x="44" y="16" fontSize="10" fontWeight="700" fill="currentColor" opacity=".5">z</text>}
      {mood === "oops" && <path d="M46 20q2 4 0 6q-2-2 0-6z" fill="var(--color-event)" opacity=".7" />}
    </svg>
  );
}
