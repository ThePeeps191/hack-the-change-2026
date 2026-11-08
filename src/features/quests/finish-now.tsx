"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

// A crew quest waits for crewmates to join until the timer runs out. Once your
// proof is in, this ends it now and takes you to the recap.
export function FinishNow({ runId }: { runId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function finish() {
    setBusy(true);
    setFailed(false);
    try {
      await api.finishRun(runId);
      router.push(`/recap/${runId}`);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }
  return (
    <>
      <p className="pb-3 text-center text-[15px] text-ink-muted">
        {failed ? "Signal's patchy. Try again in a moment." : "Your proof is in. Your crew can join until the timer runs out."}
      </p>
      <Button size="lg" className="w-full" disabled={busy} onClick={finish}>{busy ? "Finishing…" : "Finish now"}</Button>
    </>
  );
}
