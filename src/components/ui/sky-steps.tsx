"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

// A footpath drawn down the sky with a stop for each step, like a trail map.
// Each stop is an inked drawing straight on the sky; the dotted path between two
// stops wiggles a little and is revealed top to bottom (a clip-path), so it
// looks like it's being walked. With reduced motion every step is instant
// (duration 0), so the first render still matches the server.
export function SkySteps({ items, delay = 0.3 }: { items: { badge: ReactNode; title: string; detail?: string }[]; delay?: number }) {
  const reduce = useReducedMotion();
  const at = (i: number) => delay + i * 0.32;
  return (
    <ol className="relative mx-auto w-full max-w-[320px]">
      {items.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 pb-8 last:pb-0">
          {i < items.length - 1 && (
            <motion.div
              aria-hidden
              className="absolute top-12 bottom-1 left-[10px] w-6"
              initial={{ clipPath: "inset(0 0 100% 0)" }}
              animate={{ clipPath: "inset(0 0 0% 0)" }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: "easeInOut", delay: at(i) + 0.2 }}
            >
              <svg viewBox="0 0 24 100" preserveAspectRatio="none" className="block size-full overflow-visible">
              <path
                d={i % 2 ? "M12 0 C 0 35, 24 65, 12 100" : "M12 0 C 24 35, 0 65, 12 100"}
                fill="none"
                stroke="rgb(255 255 255 / .7)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="0.5 7"
                vectorEffect="non-scaling-stroke"
              />
              </svg>
            </motion.div>
          )}
          <motion.span
            className="relative grid size-11 shrink-0 place-items-center text-on-sky drop-shadow-[0_2px_6px_rgb(20_50_110/0.25)]"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 22, delay: at(i) }}
          >
            {s.badge}
          </motion.span>
          <motion.span
            className="pt-1.5 text-left"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease, delay: at(i) + 0.08 }}
          >
            <span className="block font-[family-name:var(--font-hand)] text-[24px] leading-[1.05] font-bold">{s.title}</span>
            {s.detail && <span className="mt-1 block text-[15px] leading-snug text-on-sky/95">{s.detail}</span>}
          </motion.span>
        </li>
      ))}
    </ol>
  );
}

// The quiet second choice that sits under a white pill on the sky.
export const skyQuiet =
  "flex min-h-[56px] w-full items-center justify-center rounded-[20px] text-[17px] font-semibold text-[#121412]/90 dark:text-on-sky/95 transition-colors hover:bg-white/30 dark:hover:bg-white/12";
