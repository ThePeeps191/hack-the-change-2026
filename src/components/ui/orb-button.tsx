"use client";
import { useRef, type ReactNode } from "react";

// The main action as a small living orb: a slowly turning blue and white
// metallic swirl, a glossy highlight that leans toward your finger, and a soft
// glow that breathes. Pressing squeezes it; the swirl keeps the same steady
// turn whether it is idle, pressed or loading, so it never jumps.
export function OrbButton({ onClick, disabled, label, children, size = 60 }: { onClick: () => void; disabled?: boolean; label: string; children: ReactNode; size?: number }) {
  const ref = useRef<HTMLButtonElement>(null);

  function lean(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--hx", `${Math.max(15, Math.min(85, x))}%`);
    el.style.setProperty("--hy", `${Math.max(12, Math.min(70, y))}%`);
  }

  function reset() {
    ref.current?.style.setProperty("--hx", "34%");
    ref.current?.style.setProperty("--hy", "26%");
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      onPointerMove={lean}
      onPointerLeave={reset}
      className="orb relative grid place-items-center rounded-full text-white transition-transform duration-200 ease-[var(--ease-spring)] active:scale-[0.92] disabled:cursor-wait"
      style={{ width: size, height: size }}
    >
      <span aria-hidden className="orb-glow" />
      <span aria-hidden className="orb-swirl" />
      <span aria-hidden className="orb-gloss" />
      <span aria-hidden className="orb-rim" />
      <span className="relative drop-shadow-[0_1px_2px_rgb(10_40_120/0.45)]">{children}</span>
    </button>
  );
}
