"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "@/lib/api";
import { tick } from "@/lib/feedback";
import { Card } from "@/components/ui/card";

// Three kinds of weather, the same suns and clouds the You page shows. The
// scale stored is 1 to 5 (5 sunny, 3 in between, 1 cloudy), so "felt better"
// is simply 4 or more. Before a quest it's how you are; after, how you are
// compared with before.
const SUN = "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4";
const PART = "M8 3.5v1.5M3.5 8H2M4.6 4.6l1 1M11.4 4.6l-1 1M5.6 10.4A3 3 0 1 1 10.8 7.5M9 20h8.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 9 20z";
const CLOUD = "M7.5 18.5a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17.6 9.6a4.5 4.5 0 0 1-.6 8.9z";
const WEATHER = [
  { mood: 5, d: SUN, tint: "text-[#c98a12] dark:text-[#f2c45a]" },
  { mood: 3, d: PART, tint: "text-[#5b6b85] dark:text-[#a9b8d0]" },
  { mood: 1, d: CLOUD, tint: "text-ink-faint" },
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
                        className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] bg-sunken text-[14px] font-semibold text-ink ring-1 ring-[var(--hairline)] transition-[background-color,transform] hover:bg-accent-soft active:scale-95"
                      >
                        <span className={`grid size-9 place-items-center rounded-full ${w.tint}`}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill={w.mood === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth={w.mood === 1 ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={w.d} /></svg>
                        </span>
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
