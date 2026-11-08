"use client";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

const noop = () => () => {};
const reasons = ["Made me uncomfortable", "Didn't show up", "Asked to meet somewhere else", "Something else"];

// UCalgary Campus Security, 24/7, also runs Safewalk (ucalgary.ca/risk/campus-security).
const CAMPUS_SECURITY = { label: "403-220-5333", tel: "+14032205333" };

// Emergency numbers, shown as text too: a tel: link can't always place a call.
function EmergencyHelp() {
  return (
    <div className="rounded-[18px] bg-danger-soft px-4 py-3">
      <p className="text-[15px] font-semibold text-danger">In danger? Get help now.</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <a href="tel:911" className="flex min-h-11 flex-col justify-center rounded-[12px] bg-surface px-3 py-1.5 shadow-card">
          <span className="text-[13px] text-ink-muted">Emergency</span>
          <span className="text-[17px] font-semibold text-ink">911</span>
        </a>
        <a href={`tel:${CAMPUS_SECURITY.tel}`} className="flex min-h-11 flex-col justify-center rounded-[12px] bg-surface px-3 py-1.5 shadow-card">
          <span className="text-[13px] text-ink-muted">Campus Security, 24/7</span>
          <span className="text-[17px] font-semibold text-ink tabular-nums">{CAMPUS_SECURITY.label}</span>
        </a>
      </div>
    </div>
  );
}

// Always one tap away during a quest with someone new: emergency numbers, a way
// to leave without blaming anyone, and a report. A report ends the quest for
// you, and the two of you are never matched again.
export function ReportSheet({ runId, reportedId }: { runId: string; reportedId: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<"left" | "reported" | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  // Only says it's done once the server has it: a report that never arrived
  // must not look sent.
  async function act(what: "left" | "reported", call: () => Promise<unknown>) {
    setBusy(true);
    setFailed(false);
    try {
      await call();
      setSent(what);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  const send = (reason: string) => act("reported", () => api.report({ reported_id: reportedId, run_id: runId, reason }));
  const leave = () => act("left", () => api.leaveRun(runId));

  // The sheet goes to <body> through a portal, so the sticky button bar it's
  // opened from can't sit on top of it.
  return (
    <>
      <button onClick={() => setOpen(true)} className="mx-auto flex min-h-11 items-center px-4 text-[14px] font-medium text-ink-faint hover:text-ink-muted">
        Help, leave or report
      </button>
      {mounted &&
        createPortal(
          <Sheet open={open} onClose={() => setOpen(false)} label="Help, leave or report">
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
                  <p className="mt-1 text-[15px] leading-snug text-ink-muted">We&apos;ve ended this quest for you, and you won&apos;t be matched again.</p>
                  <div className="mt-4"><EmergencyHelp /></div>
                  <ButtonLink className="mt-4 w-full" variant="secondary" href="/">Back to today</ButtonLink>
                </>
              ) : (
                <>
                  <EmergencyHelp />
                  {failed && (
                    <p className="mt-4 rounded-[14px] bg-danger-soft px-3 py-2 text-[14px] text-danger" role="alert">
                      That didn&apos;t go through. Check your signal and try again, or call the numbers above.
                    </p>
                  )}
                  <Button variant="secondary" disabled={busy} onClick={leave} className="mt-5 w-full">I need to go</Button>
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
