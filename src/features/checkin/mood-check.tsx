"use client";
import { useState } from "react";
import { api } from "@/lib/api";
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
    <Card className="rounded-[24px] p-5">
      <p className="text-[17px] font-semibold">{phase === "before" ? "How are you, honestly?" : "And now?"}</p>
      <p className="mt-0.5 text-[13px] text-ink-muted">Just for you. Skip it if you like.</p>
      <div className="mt-3 grid grid-cols-5 gap-1.5" role="group" aria-label="how you feel">
        {MOODS.map((label, i) => (
          <button
            key={label}
            onClick={() => answer(i + 1)}
            className="min-h-11 rounded-control bg-sunken px-1 text-[13px] font-semibold text-ink-muted hover:bg-accent-soft hover:text-ink"
          >
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}
