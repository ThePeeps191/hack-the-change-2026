"use client";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

const noop = () => () => {};
const reasons = ["Made me uncomfortable", "Didn't show up", "Asked to meet somewhere else", "Something else"];

// Always one tap away during a quest with someone new. Sending a report ends the
// quest for you, and the two of you are never matched again.
export function ReportSheet({ runId, reportedId }: { runId: string; reportedId: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<"left" | "reported" | null>(null);
  const [busy, setBusy] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  async function send(reason: string) {
    setBusy(true);
    await api.report({ reported_id: reportedId, run_id: runId, reason }).catch(() => {});
    setSent("reported");
    setBusy(false);
  }

  async function leave() {
    setBusy(true);
    await api.leaveRun(runId).catch(() => {});
    setSent("left");
    setBusy(false);
  }

  // The sheet goes to <body> through a portal, so the sticky button bar it's
  // opened from can't sit on top of it.
  return (
    <>
      <button onClick={() => setOpen(true)} className="mx-auto flex min-h-11 items-center px-4 text-[14px] font-medium text-ink-faint hover:text-ink-muted">
        Report or leave
      </button>
      {mounted &&
        createPortal(
          <Sheet open={open} onClose={() => setOpen(false)} label="Report or leave">
            <div className="px-5 pt-1 pb-2">
              {sent === "left" ? (
                <>
                  <p className="text-[19px] font-semibold">You&apos;ve left this quest.</p>
                  <p className="mt-1 text-[15px] leading-snug text-ink-muted">Nobody was reported. We&apos;ll let them know it&apos;s over, and you can say you&apos;re free again any time.</p>
                  <ButtonLink className="mt-4 w-full" variant="secondary" href="/">Back to today</ButtonLink>
                </>
              ) : sent ? (
                <>
                  <p className="text-[19px] font-semibold">Thanks for telling us.</p>
                  <p className="mt-1 text-[15px] leading-snug text-ink-muted">We&apos;ve ended this quest for you, and you won&apos;t be matched again. If you feel unsafe, call 911 or campus security.</p>
                  <ButtonLink className="mt-4 w-full" variant="secondary" href="/">Back to today</ButtonLink>
                </>
              ) : (
                <>
                  <Button variant="secondary" disabled={busy} onClick={leave} className="w-full">I need to go</Button>
                  <p className="mt-1.5 text-center text-[13px] text-ink-muted">Ends the quest. Nobody gets reported.</p>
                  <p className="mt-5 text-[19px] font-semibold">Something wrong?</p>
                  <p className="mt-1 text-[14px] leading-snug text-ink-muted">Reporting ends the quest too, and you won&apos;t be matched with them again.</p>
                  <div className="mt-3 grid gap-2">
                    {reasons.map((r) => (
                      <Button key={r} variant="secondary" disabled={busy} onClick={() => send(r)} className="justify-start">{r}</Button>
                    ))}
                  </div>
                  <Button variant="quiet" className="mt-1 w-full" onClick={() => setOpen(false)}>Cancel</Button>
                </>
              )}
            </div>
          </Sheet>,
          document.body,
        )}
    </>
  );
}
