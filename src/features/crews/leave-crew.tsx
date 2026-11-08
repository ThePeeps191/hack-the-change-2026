"use client";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import type { Crew } from "@/lib/contracts";
import { tick } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Ink, LeaveInk } from "@/components/ui/ink";
import { Sheet } from "@/components/ui/sheet";

const noop = () => () => {};

// A quiet "Leave crew" at the foot of the crew page. It asks first, in a sheet
// that says what you keep and how to come back, then calls onLeft so the page
// can reload into "no crew yet".
export function LeaveCrew({ crew, onLeft }: { crew: Crew; onLeft: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  async function leave() {
    setBusy(true);
    setError(null);
    try {
      await api.leaveCrew(crew.id);
      tick(0.5);
      setOpen(false);
      onLeft(crew.name);
    } catch {
      setError("That didn't go through. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex justify-center pt-2 pb-4">
        <button
          onClick={() => { tick(0.4); setError(null); setOpen(true); }}
          className="group flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger focus-visible:bg-danger-soft focus-visible:text-danger"
        >
          <Ink size={20} className="[&_.leave-arrow]:transition-transform [&_.leave-arrow]:duration-300 motion-safe:group-hover:[&_.leave-arrow]:translate-x-[2px]">{LeaveInk}</Ink>
          Leave crew
        </button>
      </div>
      {mounted && createPortal(
        <Sheet open={open} onClose={() => !busy && setOpen(false)} label={`Leave ${crew.name}`}>
          <div className="px-5 pt-1 pb-2 text-center">
            <Ink size={44} className="mx-auto text-danger">{LeaveInk}</Ink>
            <p className="mt-3 text-[19px] font-semibold text-balance">Leave {crew.name}?</p>
            <p className="mx-auto mt-1.5 max-w-[32ch] text-[15px] leading-snug text-ink-muted">
              {crew.members.length > 1
                ? "Your coins stay yours, and the crew keeps playing without you."
                : "You're the only one in it, so it goes quiet until someone uses the code. Your coins stay yours."}{" "}
              To come back, use the code{" "}
              <span className="font-mono font-semibold text-ink">{crew.invite_code}</span>.
            </p>
            {error && <p role="alert" className="mt-3 text-[14px] text-danger">{error}</p>}
            <Button variant="danger" className="mt-5 w-full bg-danger-soft ring-1 ring-danger/20 hover:brightness-95 active:brightness-90" onClick={leave} disabled={busy}>
              {busy ? "Leaving…" : "Leave crew"}
            </Button>
            <Button variant="quiet" className="mt-1 w-full" onClick={() => setOpen(false)} disabled={busy}>Stay</Button>
          </div>
        </Sheet>,
        document.body,
      )}
    </>
  );
}
