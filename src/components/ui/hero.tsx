"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Odometer } from "./odometer";

// Soft clouds drifting low across the sky. Each is a few overlapping puffs,
// blurred, moving very slowly; they sit behind the content.
function Clouds() {
  const banks = [
    { left: "-14%", bottom: "-30%", w: 300, o: 0.34, d: "68s", dl: "0s" },
    { left: "50%", bottom: "-34%", w: 340, o: 0.3, d: "84s", dl: "-30s" },
    { left: "26%", top: "18%", w: 150, o: 0.16, d: "96s", dl: "-50s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {banks.map((b, i) => (
        <div
          key={i}
          className="absolute animate-[drift_var(--d)_ease-in-out_infinite_alternate]"
          style={{ left: b.left, bottom: b.bottom, top: b.top, width: b.w, height: b.w * 0.42, opacity: b.o, ["--d" as string]: b.d, animationDelay: b.dl }}
        >
          <span className="absolute bottom-0 left-0 h-[62%] w-[58%] rounded-full bg-white blur-[18px]" />
          <span className="absolute bottom-[12%] left-[26%] h-full w-[46%] rounded-full bg-white blur-[20px]" />
          <span className="absolute right-0 bottom-0 h-[70%] w-[52%] rounded-full bg-white blur-[18px]" />
        </div>
      ))}
    </div>
  );
}

// The sky panel at the top of a screen: the live state of your day. Below it,
// a faint wash of sky tints the paper so the two read as one place.
export function Hero({ children, className = "", fill = false }: { children: ReactNode; className?: string; fill?: boolean }) {
  return (
    <div className={`relative ${fill ? "flex flex-1 flex-col" : ""}`}>
      <section
        className={`relative overflow-hidden text-on-sky ${fill ? "flex flex-1 flex-col" : "rounded-b-[36px] pb-6"} ${className}`}
        style={{
          background: "linear-gradient(180deg, var(--color-sky-top) 0%, var(--color-sky-mid) 58%, var(--color-sky-bottom) 100%)",
          textShadow: "0 1px 10px rgb(24 64 130 / 0.28)",
        }}
      >
        {/* a soft sun glow, top-right */}
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-white/25 blur-3xl" />
        <Clouds />
        <div className={`relative ${fill ? "flex flex-1 flex-col" : ""}`}>{children}</div>
      </section>
      {!fill && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-full -z-10 h-72"
          style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--color-sky-bottom) 22%, transparent), transparent)" }}
        />
      )}
    </div>
  );
}

export function HeroBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex h-14 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
      <div className="flex w-24">{left}</div>
      <div className="text-[15px] font-medium text-on-sky/95">{center}</div>
      <div className="flex w-24 justify-end">{right}</div>
    </div>
  );
}

export function HeroIcon({ href, label, d, onClick }: { href?: string; label: string; d: string; onClick?: () => void }) {
  const svg = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
  const cls = "grid size-11 place-items-center rounded-full text-on-sky/90 transition-colors hover:bg-white/15";
  return href ? (
    <Link href={href} aria-label={label} className={cls}>{svg}</Link>
  ) : (
    <button aria-label={label} onClick={onClick} className={cls}>{svg}</button>
  );
}

// A ring stat: an arc for progress, a big number, and a label beneath.
export function Ring({ value, label, progress, color }: { value: number | string; label: string; progress: number; color: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative grid size-[96px] place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="rgb(255 255 255 / 0.14)" stroke="rgb(255 255 255 / 0.28)" strokeWidth="5" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p)}
            className="transition-[stroke-dashoffset] duration-[1200ms] ease-[var(--ease-out-soft)]"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <Odometer value={value} className="font-[family-name:var(--font-display)] text-[26px] font-semibold tracking-[-0.02em]" />
      </div>
      <span className="text-[13px] font-medium text-on-sky/90">{label}</span>
    </div>
  );
}

// Round frosted icon button that sits beside the main pill.
export function RoundButton({ href, label, d, onClick }: { href?: string; label: string; d: string; onClick?: () => void }) {
  const cls = "grid size-[52px] shrink-0 place-items-center rounded-full bg-white/22 text-on-sky backdrop-blur-md transition-[background-color,transform] hover:bg-white/30 active:scale-95";
  const svg = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
  return href ? (
    <Link href={href} aria-label={label} className={cls}>{svg}</Link>
  ) : (
    <button aria-label={label} onClick={onClick} className={cls}>{svg}</button>
  );
}

// A dusk sky: deep blue overhead, a warm glow at the horizon. For the few
// surfaces that need to be dark (the live quest, Claim), so they still feel
// like outdoors rather than a dashboard.
export const dusk = "linear-gradient(170deg, #1a3466 0%, #22407a 52%, #4b4f86 82%, #a8697a 118%)";

// A handful of faint stars, placed by hand so they never clump.
export function Stars({ className = "" }: { className?: string }) {
  const stars = [
    [8, 14, 1.6], [22, 30, 1], [37, 9, 1.2], [55, 22, 1.8], [68, 8, 1], [82, 26, 1.4], [91, 12, 1],
    [14, 52, 1], [46, 44, 1.1], [74, 48, 1], [88, 60, 1.3], [30, 68, 0.9],
  ];
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {stars.map(([x, y, r], i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-white ${i % 4 === 0 ? "animate-[twinkle_4s_ease-in-out_infinite]" : ""}`}
          style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, opacity: 0.35 + (i % 3) * 0.2, animationDelay: `${i * 0.7}s` }}
        />
      ))}
    </div>
  );
}

export const icons = {
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  map: "M9 4.5l6 2 5-2v13l-5 2-6-2-5 2v-13zM9 4.5v13M15 6.5v13",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M8 10v4M16 16v4",
  history: "M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4M12 7.5V12l3 2",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
};
