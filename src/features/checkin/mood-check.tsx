"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "@/lib/api";
import { tick } from "@/lib/feedback";
import { Card } from "@/components/ui/card";

const MOODS = ["Rough", "Low", "Okay", "Good", "Great"];

function answered(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

// One optional tap before and after a quest. Private, and never ranked. Only
// render this once the run has loaded, because it reads sessionStorage.
// After a tap it says thanks for a moment, then folds away smoothly.
export function MoodCheck({ runId, phase }: { runId: string; phase: "before" | "after" }) {
  const key = `amble_mood_${runId}_${phase}`;
  const [done, setDone] = useState(() => answered(key));
  const [picked, setPicked] = useState<number | null>(null);

  function answer(mood: number) {
    tick(0.7);
    setPicked(mood);
    api.checkin(runId, { phase, mood }).catch(() => {});
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
    setTimeout(() => setDone(true), 1300);
  }

  return (
    <AnimatePresence initial={false}>
      {!done && (
        <motion.div
          key="mood"
          initial={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <Card className="rounded-[24px] p-5">
            <AnimatePresence mode="wait" initial={false}>
              {picked == null ? (
                <motion.div key="ask" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <p className="text-[17px] font-semibold">{phase === "before" ? "How are you, honestly?" : "And now?"}</p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">Just for you. Skip it if you like.</p>
                  <div className="mt-3 grid grid-cols-5 gap-1.5" role="group" aria-label="How you feel">
                    {MOODS.map((label, i) => (
                      <button
                        key={label}
                        onClick={() => answer(i + 1)}
                        className="min-h-11 rounded-control bg-sunken px-1 text-[13px] font-semibold text-ink ring-1 ring-[var(--hairline)] transition-[background-color,transform] hover:bg-accent-soft active:scale-95"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="thanks"
                  role="status"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-2 text-[16px] font-semibold"
                >
                  {MOODS[picked - 1]}. Noted, just for you.
                </motion.p>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
