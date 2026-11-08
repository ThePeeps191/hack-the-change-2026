"use client";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import type { Quest } from "@/lib/contracts";
import { tick } from "@/lib/feedback";
import { Coin } from "@/components/ui/quest-glyph";
import { GlyphTile, QuestMetaLine } from "./quest-card";

// The quests past the first few, folded into one card that opens like a
// dropdown into short rows. Today and Map both use it, so "more quests" looks
// the same everywhere. Tapping a row opens that quest.
export function MoreQuests({ quests, onPick }: { quests: Quest[]; onPick: (q: Quest) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (quests.length === 0) return null;
  return (
    <motion.div layout className="overflow-hidden rounded-[22px] bg-surface shadow-card ring-1 ring-[var(--hairline)]">
      <button
        onClick={() => { tick(0.6); setOpen((o) => !o); }}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left"
      >
        <span className="text-[16px] font-semibold">
          {quests.length} more {quests.length === 1 ? "quest" : "quests"}
          <span className="font-normal text-ink-muted"> · farther away</span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 text-ink-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {quests.map((q) => (
              <li key={q.id} className="border-t border-[var(--hairline)]">
                <button onClick={() => onPick(q)} className="group flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--hairline)]">
                  <GlyphTile quest={q} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{q.title.charAt(0).toUpperCase() + q.title.slice(1)}</span>
                    <QuestMetaLine quest={q} />
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold tabular-nums">
                    <Coin size={14} />
                    {q.coins}
                    <span className="sr-only"> coins</span>
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
