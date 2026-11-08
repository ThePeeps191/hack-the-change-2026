"use client";
import { motion } from "motion/react";
import type { LeaderboardEntry } from "@/lib/contracts";
import { Avatar, Crown } from "@/components/ui/avatar";
import { Coin } from "@/components/ui/quest-glyph";
import { Odometer } from "@/components/ui/odometer";

// The top three crews of the week on a small podium: first in the middle and
// highest, wearing the crown. Steps rise in on a spring, one after another.
const steps = [
  { at: 1, h: 64, tint: "var(--podium-2)", label: "2nd" },
  { at: 0, h: 92, tint: "var(--podium-1)", label: "1st" },
  { at: 2, h: 48, tint: "var(--podium-3)", label: "3rd" },
];

export function Podium({ top, ours }: { top: LeaderboardEntry[]; ours?: string }) {
  return (
    <div className="grid grid-cols-3 items-end gap-2 px-1 pt-3">
      {steps.map((s, i) => {
        const e = top[s.at];
        if (!e) return <div key={i} />;
        const mine = e.id === ours;
        return (
          <motion.div
            key={e.id}
            className="flex min-w-0 flex-col items-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 + [0.15, 0, 0.3][i] }}
          >
            <div className="relative">
              {s.at === 0 && (
                <motion.span
                  className="absolute -top-[18px] left-1/2 -translate-x-1/2"
                  initial={{ y: -10, rotate: -18, opacity: 0 }}
                  animate={{ y: 0, rotate: -8, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.55 }}
                >
                  <Crown size={24} />
                </motion.span>
              )}
              <Avatar name={e.name} avatar={e.avatar} size={s.at === 0 ? 56 : 46} ring={mine} />
            </div>
            {/* A one-line name sits at the bottom of its two-line space, so it stays right above its coins. */}
            <div className="mt-2 flex min-h-[2.5em] items-end px-1 text-[13px] leading-tight">
              <p className={`line-clamp-2 text-center ${mine ? "font-semibold text-ink" : "font-medium text-ink-muted"}`}>{e.name}</p>
            </div>
            <span className="mt-1 flex items-center gap-1 text-[14px] font-semibold">
              <Coin size={13} />
              <Odometer value={e.coins} delay={300 + i * 100} />
            </span>
            <motion.div
              className="mt-2 grid w-full place-items-start justify-center rounded-t-[14px] pt-2 text-[13px] font-semibold text-[var(--podium-ink)] shadow-[inset_0_1px_0_var(--podium-edge)]"
              style={{ background: s.tint, transformOrigin: "50% 100%" }}
              initial={{ height: 0 }}
              animate={{ height: s.h }}
              transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.2 + [0.15, 0, 0.3][i] }}
            >
              {s.label}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
