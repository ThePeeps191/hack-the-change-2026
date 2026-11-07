"use client";
import { useEffect, useState } from "react";

// A soft ring that slowly empties as time passes. Shows minutes, not a ticking clock,
// until the last two minutes, so it reads as "plenty of time" rather than a race.
export function GentleTimer({ startedAt, endsAt }: { startedAt: string; endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = Date.parse(startedAt);
  const end = Date.parse(endsAt);
  const left = Math.max(0, (end - now) / 1000);
  const progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const r = 44;
  const c = 2 * Math.PI * r;
  const late = left < 120;

  const label =
    left === 0 ? "time's up" : late ? `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}` : `${Math.ceil(left / 60)}`;

  return (
    <div className="relative grid size-28 place-items-center" role="timer" aria-label={`${Math.ceil(left / 60)} minutes left`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-sunken)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={late ? "var(--color-sun)" : "var(--color-accent)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * progress}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="text-center leading-none">
        <div className="text-[28px] font-extrabold tabular-nums">{label}</div>
        {!late && left > 0 && <div className="mt-1 text-[12px] font-semibold text-ink-muted">min left</div>}
      </div>
    </div>
  );
}
