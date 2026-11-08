"use client";
import { CloudInk, Ink, PartInk, SunInk } from "@/components/ui/ink";
import { motion } from "motion/react";

// "You came in feeling Low and left feeling Better": the before and after
// check-ins side by side on the recap. Only you see it, and it only shows when
// you answered both. Same 1 to 5 scale as MoodCheck.
const BEFORE: Record<number, string> = { 5: "Good", 3: "Okay", 1: "Low" };
const AFTER: Record<number, string> = { 5: "Better", 3: "The same", 1: "Worse" };
const ICON: Record<number, React.ReactNode> = { 5: SunInk, 3: PartInk, 1: CloudInk };

function line(before: number, after: number) {
  if (after >= 4 && before <= 2) return "You came in feeling low and left feeling better. That's what this is for.";
  if (after >= 4) return "You left feeling better than you came.";
  if (after === 3) return "About the same as when you started. Some walks are just walks.";
  return "Not every quest lands. Thanks for being honest with yourself.";
}

export function MoodShift({ before, after }: { before: number; after: number }) {
  if (!BEFORE[before] || !AFTER[after]) return null;
  return (
    <motion.section
      className="rounded-[24px] bg-surface p-5 shadow-card"
      aria-label="How you felt"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-center gap-4">
        <span className="flex flex-col items-center gap-1 text-[13px] text-ink-muted">
          <Ink size={30} className="text-ink">{ICON[before]}</Ink>
          Before: {BEFORE[before]}
        </span>
        <svg width="28" height="14" viewBox="0 0 28 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint" aria-hidden>
          <path d="M2 7h22M19 2l5 5-5 5" />
        </svg>
        <span className="flex flex-col items-center gap-1 text-[13px] text-ink-muted">
          <Ink size={30} className="text-ink">{ICON[after]}</Ink>
          After: {AFTER[after]}
        </span>
      </div>
      <p className="mt-3 text-center text-[15px] leading-snug text-ink">{line(before, after)}</p>
      <p className="mt-1 text-center text-[12px] text-ink-faint">Just for you.</p>
    </motion.section>
  );
}
