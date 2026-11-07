"use client";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { type ComponentProps, type PointerEvent, type ReactNode, useRef } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger" | "onSky";
type Size = "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 font-semibold select-none whitespace-nowrap transition-[background-color,color,box-shadow,opacity] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-press hover:bg-accent-strong",
  secondary: "bg-surface text-ink shadow-card hover:bg-sunken",
  quiet: "text-ink-muted hover:text-ink",
  danger: "text-danger hover:bg-danger-soft",
  // the white pill that sits on the sky panel and on dark toasts
  onSky: "bg-white text-[#0d0e0d] shadow-[0_6px_20px_rgb(13_14_13/0.18)] hover:bg-white/95",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-5 rounded-control text-[15px]",
  lg: "min-h-[60px] px-6 rounded-[20px] text-[17px] w-full tracking-[-0.01em]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} active:scale-[0.98] ${extra}`;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", size = "md", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// A button that leans toward your thumb or cursor like it's magnetised, and
// springs back. The label moves a little further than the body, for depth.
export function MagneticButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  strength = 0.22,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 18, mass: 0.6 });
  const y = useSpring(my, { stiffness: 260, damping: 18, mass: 0.6 });
  const lx = useTransform(x, (v) => v * 0.5);
  const ly = useTransform(y, (v) => v * 0.5);

  function move(e: PointerEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    mx.set(Math.max(-14, Math.min(14, dx * strength * 0.25)));
    my.set(Math.max(-10, Math.min(10, dy * strength)));
  }
  function leave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      onPointerUp={leave}
      onClick={onClick}
      disabled={disabled}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 26 }}
      className={`${base} ${variants[variant]} ${sizes.lg} ${className}`}
    >
      <motion.span style={{ x: lx, y: ly }} className="inline-flex items-center gap-2">
        {children}
      </motion.span>
    </motion.button>
  );
}
