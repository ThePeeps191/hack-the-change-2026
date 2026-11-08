"use client";
import { CloudInk, Ink, PartInk, SunInk } from "@/components/ui/ink";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "@/lib/api";
import { tick } from "@/lib/feedback";
import { Card } from "@/components/ui/card";

// Three kinds of weather, the same suns and clouds the You page shows. The
// scale stored is 1 to 5 (5 sunny, 3 in between, 1 cloudy), so "felt better"
// is simply 4 or more. Before a quest it's how you are; after, how you are
// compared with before.
const WEATHER = [
  { mood: 5, d: SunInk, tint: "text-[#c98a12] dark:text-[#f2c45a]" },
  { mood: 3, d: PartInk, tint: "text-ink" },
  { mood: 1, d: CloudInk, tint: "text-ink-muted" },
];
const LABELS = { before: ["Good", "Okay", "Low"], after: ["Better", "Same", "Worse"] };

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
export function MoodCheck({ runId, phase, onAnswer }: { runId: string; phase: "before" | "after"; onAnswer?: (mood: number) => void }) {
  const key = `amble_mood_${runId}_${phase}`;
  const [done, setDone] = useState(() => answered(key));
  const [picked, setPicked] = useState<number | null>(null);

  function answer(mood: number) {
    tick(0.7);
    setPicked(mood);
    api.checkin(runId, { phase, mood }).catch(() => {});
    onAnswer?.(mood);
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
    setTimeout(() => setDone(true), 1300);
  }

  const labels = LABELS[phase];
  const said = picked == null ? "" : labels[WEATHER.findIndex((w) => w.mood === picked)];

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
                  <p className="text-[17px] font-semibold">{phase === "before" ? "How are you, honestly?" : "How do you feel now?"}</p>
                  <p className="mt-0.5 text-[14px] text-ink-muted">{phase === "before" ? "Just for you. Skip it if you like." : "Compared with before. Just for you."}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="How you feel">
                    {WEATHER.map((w, i) => (
                      <button
                        key={w.mood}
                        onClick={() => answer(w.mood)}
                        className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] text-[14px] font-semibold text-ink ring-1 ring-black/12 transition-[box-shadow,transform] dark:ring-white/15 hover:ring-ink-faint active:scale-95"
                      >
                        <Ink size={30} className={w.tint}>{w.d}</Ink>
                        {labels[i]}
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
                  {said}. Noted, just for you.
                </motion.p>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
