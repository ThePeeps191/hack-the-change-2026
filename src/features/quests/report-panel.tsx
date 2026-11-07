"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, ButtonLink } from "@/components/ui/button";

const reasons = ["made me uncomfortable", "didn't show up", "asked to meet somewhere else", "something else"];

// Always one tap away during a stranger quest. Sending a report also ends it for you.
export function ReportPanel({ runId, reportedId, onClose }: { runId: string; reportedId: string; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(reason: string) {
    setBusy(true);
    await api.report({ reported_id: reportedId, run_id: runId, reason }).catch(() => {});
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-lift" role="dialog" aria-label="report or leave">
      {sent ? (
        <>
          <p className="font-semibold">thanks for telling us.</p>
          <p className="mt-1 text-sm text-ink-muted">we&apos;ve ended this quest for you. if you feel unsafe, call 911 or campus security.</p>
          <ButtonLink className="mt-3 w-full" variant="secondary" href="/">back home</ButtonLink>
        </>
      ) : (
        <>
          <p className="font-semibold">what happened?</p>
          <div className="mt-3 grid gap-2">
            {reasons.map((r) => (
              <Button key={r} variant="secondary" disabled={busy} onClick={() => send(r)} className="justify-start">
                {r}
              </Button>
            ))}
          </div>
          <Button variant="quiet" className="mt-2 w-full" onClick={onClose}>cancel</Button>
        </>
      )}
    </div>
  );
}
