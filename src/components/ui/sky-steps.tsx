"use client";
import { motion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

// A short list of frosted rows on the sky, each with a white badge, that
// slides in one after another. Used where a screen explains what happens next.
export function SkySteps({ items, delay = 0.3 }: { items: { badge: ReactNode; title: string; detail?: string }[]; delay?: number }) {
  return (
    <ol className="relative mx-auto w-full max-w-[340px] space-y-3">
      {items.map((s, i) => (
        <motion.li
          key={s.title}
          className="flex items-center gap-4 rounded-[20px] bg-white/14 px-4 py-3.5 ring-1 ring-white/20 backdrop-blur-md"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease, delay: delay + i * 0.12 }}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[16px] font-bold text-[var(--color-sky-top)]">{s.badge}</span>
          <span className="text-left">
            <span className="block text-[16px] font-semibold">{s.title}</span>
            {s.detail && <span className="block text-[14px] text-on-sky/80">{s.detail}</span>}
          </span>
        </motion.li>
      ))}
    </ol>
  );
}

// The quiet second choice that sits under a white pill on the sky.
export const skyQuiet =
  "flex min-h-[56px] w-full items-center justify-center rounded-[20px] text-[17px] font-semibold text-on-sky transition-colors hover:bg-white/12";
