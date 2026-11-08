"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Quest } from "@/lib/contracts";
import { getPosition, type Position } from "@/lib/geo";
import { Button } from "@/components/ui/button";

// Asks the AI to write quests for where you're standing, so you can watch it
// happen. Uses your location if you allow it, campus if not, and says which.
// The server reuses quests written nearby in the last few hours, and falls back
// to the starter pack if the AI is slow, so the note says what you really got.
export function WriteHere({ known, onQuests }: { known: Set<string>; onQuests: (quests: Quest[], at: Position) => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function write() {
    if (busy) return;
    setBusy(true);
    setNote("Writing takes about 20 seconds.");
    const at = await getPosition();
    try {
      const quests = await api.generateQuests(at.lat, at.lng, 3);
      onQuests(quests, at);
      // The new quests land at the top of the list, well above this button.
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("nearby")?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
      const fresh = quests.some((q) => !known.has(q.id));
      if (at.approximate) setNote("Quests for campus, since we can't see where you are.");
      else setNote(fresh ? "Fresh quests for right where you're standing." : "No new spots here, so these are the closest quests.");
    } catch {
      setNote("We couldn't write quests just now. The ones above still work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-2 px-1">
      {/* aria-disabled rather than disabled, so the button doesn't fade out during a 20 s wait */}
      <Button
        variant="secondary"
        onClick={write}
        aria-disabled={busy}
        aria-busy={busy}
        aria-describedby={note ? "write-here-note" : undefined}
        className="[@media(hover:none)]:hover:bg-surface"
      >
        <svg className={busy ? "motion-safe:animate-pulse" : ""} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" />
          <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
        </svg>
        {busy ? "Writing quests for here…" : "Write quests for right here"}
      </Button>
      <p id="write-here-note" role="status" className="min-h-5 text-center text-[13px] text-ink-muted">{note}</p>
    </div>
  );
}
