"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, ButtonLink } from "@/components/ui/button";

const reasons = ["Made me uncomfortable", "Didn't show up", "Asked to meet somewhere else", "Something else"];

// Always one tap away during a quest with someone new. Sending a report ends the
// quest for you, and the two of you are never matched again.
export function ReportSheet({ runId, reportedId }: { runId: string; reportedId: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(reason: string) {
    setBusy(true);
    await api.report({ reported_id: reportedId, run_id: runId, reason }).catch(() => {});
    setSent(true);
    setBusy(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mx-auto flex min-h-11 items-center px-4 text-[14px] font-medium text-ink-faint hover:text-ink-muted">
        Report or leave
      </button>
    );
  }

  return (
    <section className="mx-4 rounded-[24px] bg-surface p-5 shadow-lift" role="dialog" aria-label="Report or leave">
      {sent ? (
        <>
          <p className="text-[17px] font-semibold">Thanks for telling us.</p>
          <p className="mt-1 text-[14px] leading-snug text-ink-muted">We&apos;ve ended this quest for you, and you won&apos;t be matched again. If you feel unsafe, call 911 or campus security.</p>
          <ButtonLink className="mt-4 w-full" variant="secondary" href="/">Back to today</ButtonLink>
        </>
      ) : (
        <>
          <p className="text-[17px] font-semibold">What happened?</p>
          <div className="mt-3 grid gap-2">
            {reasons.map((r) => (
              <Button key={r} variant="secondary" disabled={busy} onClick={() => send(r)} className="justify-start">{r}</Button>
            ))}
          </div>
          <Button variant="quiet" className="mt-1 w-full" onClick={() => setOpen(false)}>Cancel</Button>
        </>
      )}
    </section>
  );
}
