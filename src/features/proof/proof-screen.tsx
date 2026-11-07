"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { QuestRun, Verdict } from "@/lib/contracts";
import { getPosition } from "@/lib/geo";
import { usePoll } from "@/lib/use-poll";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";

type Step = "capture" | "sending" | "checking" | "approved" | "rejected";

export function ProofScreen() {
  const { runId } = useParams<{ runId: string }>();
  const forceReject = useSearchParams().get("mock") === "reject";
  const [run, setRun] = useState<QuestRun | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("capture");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.run(runId).then(setRun).catch(() => setError("we can't find this quest. it may have ended."));
  }, [runId]);

  function pick(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  // While Gemini looks, poll the run for our final verdict.
  const settled = (r: QuestRun) => {
    const v = r.members[0]?.verdict;
    return !!v && v.status !== "pending";
  };
  const { data: polled } = usePoll(() => api.run(runId), { enabled: step === "checking", ms: 1200, until: settled });
  const polledVerdict = step === "checking" && polled && settled(polled) ? polled.members[0].verdict : null;
  const shownVerdict = polledVerdict ?? verdict;
  const view: Step = polledVerdict ? (polledVerdict.status as Step) : step;

  useEffect(() => {
    if (view === "approved") navigator.vibrate?.([20, 40, 20]);
  }, [view]);

  async function submit() {
    if (!run) return;
    setStep("sending");
    setError(null);
    try {
      const pos = await getPosition(4000);
      const form = new FormData();
      if (file) form.set("media", file);
      if (!pos.approximate) {
        form.set("lat", String(pos.lat));
        form.set("lng", String(pos.lng));
      }
      form.set("taken_at", new Date().toISOString());
      if (forceReject) form.set("mock_verdict", "rejected");
      const v = await api.submitProof(run.id, form);
      if (v.status === "pending") setStep("checking");
      else {
        setVerdict(v);
        setStep(v.status);
      }
    } catch (e) {
      setError(e instanceof ApiError && e.status >= 400 && e.status < 500 ? e.message : "that didn't send. your photo is still here, so try again when you have signal.");
      setStep("capture");
    }
  }

  const kind = run?.quest.proof ?? "photo";
  const accept = kind === "video" ? "video/*" : "image/*";

  return (
    <AppShell nav={false}>
      <TopBar back={`/quest/${runId}`} title="add your proof" />
      <div className="flex flex-1 flex-col px-4">
        {!run && !error && <Skeleton className="h-80 w-full rounded-card" />}
        {error && <div className="pb-3"><Notice tone="danger">{error}</Notice></div>}

        {run && (view === "capture" || view === "sending") && (
          <>
            <p className="pb-3 text-ink-muted">{run.quest.title}: {kind === "gps" ? "your route is the proof. just send it." : `one ${kind} that shows it.`}</p>
            {kind !== "gps" && (
              <>
                <input ref={input} type="file" accept={accept} capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
                <button
                  onClick={() => input.current?.click()}
                  className="grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-card border-2 border-dashed border-line bg-surface text-ink-muted hover:border-accent hover:text-ink"
                >
                  {preview ? (
                    kind === "video" ? <video src={preview} className="size-full object-cover" muted playsInline autoPlay loop /> : // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="your proof" className="size-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                      <span className="font-semibold">tap to take a {kind}</span>
                    </span>
                  )}
                </button>
              </>
            )}
          </>
        )}

        {view === "checking" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Mascot mood="thinking" size={88} />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">having a look…</h1>
            <p className="mt-2 max-w-[30ch] text-ink-muted">checking your {kind} against the quest, the place and the time.</p>
          </div>
        )}

        {view === "approved" && shownVerdict && (
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-[rise_var(--duration-slow)_var(--ease-spring)]">
            <Mascot mood="cheer" size={104} />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">that counts</h1>
            <p className="mt-2 max-w-[32ch] text-ink-muted">{shownVerdict.reason}</p>
            {shownVerdict.coins != null && (
              <p className="mt-4 rounded-chip bg-warning-soft px-4 py-1.5 text-lg font-extrabold text-coin tabular-nums animate-[rise_var(--duration-slow)_var(--ease-spring)_200ms_both]">+{shownVerdict.coins} coins</p>
            )}
          </div>
        )}

        {view === "rejected" && shownVerdict && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Mascot mood="oops" size={88} />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">not quite yet</h1>
            <Card className="mt-3 p-4 text-left text-ink-muted">{shownVerdict.reason}</Card>
          </div>
        )}
      </div>

      <div className="space-y-2 px-4 pt-4 pb-6">
        {(view === "capture" || view === "sending") && run && (
          <Button size="lg" onClick={submit} disabled={view === "sending" || (kind !== "gps" && !file)}>
            {view === "sending" ? "sending…" : "send it"}
          </Button>
        )}
        {view === "approved" && <ButtonLink size="lg" href={`/quest/${runId}`}>back to the quest</ButtonLink>}
        {view === "rejected" && (
          <Button size="lg" onClick={() => { pick(null); setVerdict(null); setStep("capture"); }}>try another {kind}</Button>
        )}
      </div>
    </AppShell>
  );
}
