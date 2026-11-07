"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";

const MOODS = ["rough", "low", "okay", "good", "great"];

function answered(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

// One optional tap before and after a quest. Private, and never ranked. Only
// render this once the run has loaded, because it reads sessionStorage.
export function MoodCheck({ runId, phase }: { runId: string; phase: "before" | "after" }) {
  const key = `amble_mood_${runId}_${phase}`;
  const [done, setDone] = useState(() => answered(key));

  function answer(mood: number) {
    setDone(true);
    api.checkin(runId, { phase, mood }).catch(() => {});
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
  }

  if (done) return null;
  return (
    <Card className="p-4">
      <p className="font-semibold">{phase === "before" ? "how are you, honestly?" : "and now?"}</p>
      <p className="mt-0.5 text-[13px] text-ink-muted">just for you. skip it if you like.</p>
      <div className="mt-3 grid grid-cols-5 gap-1.5" role="group" aria-label="how you feel">
        {MOODS.map((label, i) => (
          <button
            key={label}
            onClick={() => answer(i + 1)}
            className="min-h-11 rounded-control border border-line bg-surface px-1 text-[13px] font-semibold text-ink-muted hover:border-accent hover:text-ink"
          >
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}
