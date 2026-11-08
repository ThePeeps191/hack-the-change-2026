"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ThinkingOrb } from "thinking-orbs";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { QuestRun, Verdict } from "@/lib/contracts";
import { chime, coins, knock, tick } from "@/lib/feedback";
import { getPosition } from "@/lib/geo";
import { usePoll } from "@/lib/use-poll";
import { MAX_UPLOAD_BYTES, shrinkPhoto } from "@/lib/shrink-photo";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Odometer } from "@/components/ui/odometer";

type Step = "capture" | "sending" | "checking" | "approved" | "rejected";

const soft = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

// A camera-like screen: dark, full bleed, the photo is the hero. While Gemini
// looks, an orb thinks over the blurred photo. Approved photos "develop" back
// into focus; rejected ones stay grey with a kind reason and a retry.
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
    api.run(runId).then(setRun).catch(() => setError("We can't find this quest. It may have ended."));
  }, [runId]);

  function pick(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
    if (next) tick(0.8);
  }

  // While Gemini looks, poll the run for our final verdict.
  const settled = (r: QuestRun) => {
    const v = r.members[0]?.verdict;
    return !!v && v.status !== "pending";
  };
  const { data: polled } = usePoll(() => api.run(runId), { enabled: step === "checking", ms: 1200, until: settled });
  const polledVerdict = step === "checking" && polled && settled(polled) ? polled.members[0].verdict : null;
  const shown = polledVerdict ?? verdict;
  const view: Step = polledVerdict ? (polledVerdict.status as Step) : step;

  const prev = useRef<Step>("capture");
  useEffect(() => {
    if (view === prev.current) return;
    if (view === "approved") {
      chime();
      setTimeout(coins, 650);
      // re-read the run: if this was the last proof, the quest is done and the button can go to the recap
      api.run(runId).then(setRun).catch(() => {});
    }
    if (view === "rejected") knock();
    prev.current = view;
  }, [view, runId]);

  async function submit() {
    if (!run) return;
    setStep("sending");
    setError(null);
    try {
      const media = file ? await shrinkPhoto(file) : null;
      if (media && media.size > MAX_UPLOAD_BYTES) {
        setError("That one's too big to send. Try a shorter clip, under about 10 seconds.");
        setStep("capture");
        return;
      }
      const pos = await getPosition(4000);
      const form = new FormData();
      if (media) form.set("media", media);
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
      setError(e instanceof ApiError && e.status >= 400 && e.status < 500 ? e.message : "That didn't send. Your photo is still here, so try again when you have signal.");
      setStep("capture");
    }
  }

  function retry() {
    pick(null);
    setVerdict(null);
    setStep("capture");
  }

  const kind = run?.quest.proof ?? "photo";
  const accept = kind === "video" ? "video/*" : "image/*";
  const looking = view === "sending" || view === "checking";
  const photoFilter =
    view === "approved" ? "" : view === "rejected" ? "grayscale(1) brightness(.55)" : looking ? "blur(14px) brightness(.6) saturate(.8)" : "";

  return (
    <AppShell nav={false}>
      <div className="dark-stage flex min-h-dvh flex-1 flex-col bg-[#0b0c0b] text-white">
        <header className="flex h-14 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
          <Link href={`/quest/${runId}`} aria-label="Back to the quest" className="grid size-11 place-items-center rounded-full text-white/90 hover:bg-white/10">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.5 5.5L8 12l6.5 6.5" />
            </svg>
          </Link>
          <span className="text-[15px] font-medium text-white/90">our proof</span>
          <span className="w-11" />
        </header>

        <p className="px-6 pb-4 text-center text-[15px] leading-snug text-white/70">
          {run ? (kind === "gps" ? "Your walk is the proof. Just send it." : `One ${kind} for “${run.quest.title.charAt(0).toUpperCase() + run.quest.title.slice(1)}”.`) : " "}
        </p>

        {/* The frame */}
        <div className="relative mx-3 aspect-[4/5] overflow-hidden rounded-[28px] bg-white/[0.06]">
          <input ref={input} type="file" accept={accept} capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          {preview ? (
            <div
              className={`size-full transition-[filter] duration-[900ms] ${view === "approved" ? "animate-[develop_1.4s_var(--ease-out-soft)]" : ""}`}
              style={{ filter: photoFilter || undefined }}
            >
              {kind === "video" ? (
                <video src={preview} className="size-full object-cover" muted playsInline autoPlay loop />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Your proof" className="size-full object-cover" />
              )}
            </div>
          ) : (
            kind !== "gps" && (
              <button onClick={() => input.current?.click()} className="grid size-full place-items-center text-white/60 hover:text-white/85" disabled={looking}>
                <span className="flex flex-col items-center gap-3">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  <span className="text-[15px] font-medium">Tap to take a {kind}</span>
                </span>
              </button>
            )
          )}

          {/* viewfinder corners while capturing */}
          {view === "capture" && (
            <div aria-hidden className="pointer-events-none absolute inset-5">
              {["top-0 left-0 border-t-2 border-l-2 rounded-tl-xl", "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl", "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-xl"].map((c) => (
                <span key={c} className={`absolute size-7 border-white/55 ${c}`} />
              ))}
            </div>
          )}

          <AnimatePresence>
            {(looking || (kind === "gps" && view !== "capture")) && view !== "approved" && view !== "rejected" && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={soft}
              >
                <ThinkingOrb state="searching" size={64} theme="dark" color="#ffffff" aria-label="Checking your proof" />
                <Hand className="text-[26px] leading-none font-bold">{view === "sending" ? "sending…" : "having a look…"}</Hand>
                <p className="max-w-[26ch] text-center text-[14px] leading-snug text-white/70">Checking it against the quest, the place and the time.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <p className="px-6 pt-4 text-center text-[14px] text-[#ffb4a3]" role="alert">{error}</p>}
        {!run && !error && <p className="px-6 pt-4 text-center text-[14px] text-white/50">Loading the quest…</p>}

        {/* The verdict, rising from the bottom */}
        <AnimatePresence mode="wait">
          {(view === "approved" || view === "rejected") && shown && (
            <motion.div
              key={view}
              className="px-6 pt-6 text-center"
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...soft, delay: view === "approved" ? 0.5 : 0.1 }}
              role="status"
            >
              <Hand as="h1" className="text-[38px] leading-none font-bold">{view === "approved" ? "that counts" : "not quite yet"}</Hand>
              <p className="mx-auto mt-2 max-w-[32ch] text-[15px] leading-snug text-white/75">{shown.reason.charAt(0).toUpperCase() + shown.reason.slice(1)}</p>
              {view === "approved" && shown.coins != null && (
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="numeral text-[52px] leading-none">+</span>
                  <Odometer value={shown.coins} delay={700} className="numeral text-[52px] leading-none" />
                  <span className="ml-2 text-[16px] font-medium text-white/80">coins</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto flex flex-col items-center gap-1 px-4 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          {run && view === "capture" && (kind === "gps" || file) && (
            <>
              <button onClick={submit} className="flex min-h-14 w-full items-center justify-center rounded-full bg-white text-[17px] font-semibold text-[#0b0c0b] transition-transform active:scale-[0.98]">
                Send it
              </button>
              {kind !== "gps" && (
                <button onClick={() => input.current?.click()} className="min-h-12 px-4 text-[15px] font-medium text-white/70 hover:text-white">
                  Retake
                </button>
              )}
            </>
          )}
          {run && view === "capture" && kind !== "gps" && !file && (
            <button
              onClick={() => input.current?.click()}
              aria-label={`Take a ${kind}`}
              className="grid size-[76px] place-items-center rounded-full border-[3px] border-white/85 transition-transform active:scale-95"
            >
              <span className="size-[60px] rounded-full bg-white" />
            </button>
          )}
          {view === "approved" && (
            <Link href={run?.status === "completed" ? `/recap/${runId}` : `/quest/${runId}`} className="flex min-h-14 w-full items-center justify-center rounded-full bg-white text-[17px] font-semibold text-[#0b0c0b]">
              {run?.status === "completed" ? "See how it went" : "Back to the quest"}
            </Link>
          )}
          {view === "rejected" && (
            <>
              <button onClick={retry} className="flex min-h-14 w-full items-center justify-center rounded-full bg-white text-[17px] font-semibold text-[#0b0c0b]">
                Try another {kind}
              </button>
              <Link href={`/quest/${runId}`} className="flex min-h-12 items-center px-4 text-[15px] font-medium text-white/70">Back to the quest</Link>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
