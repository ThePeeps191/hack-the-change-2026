"use client";
import { motion, useReducedMotion } from "motion/react";
import { useParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ApiError, api } from "@/lib/api";
import type { Recap } from "@/lib/contracts";
import { chime } from "@/lib/feedback";
import { Split } from "@/components/ui/split";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Button, ButtonLink, MagneticButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { Ink, StepsInk, SunInk } from "@/components/ui/ink";
import { Coin } from "@/components/ui/quest-glyph";
import { MoodCheck } from "@/features/checkin/mood-check";
import { MoodShift } from "@/features/checkin/mood-shift";
import { MeetPaths } from "./meet-paths";
import { RecapExtras } from "./recap-extras";


// Why a recap can't be shown, each with an honest heading and one way on.
type Problem = "missing" | "unfinished" | "offline" | "broken";
const PROBLEMS: Record<Problem, { title: string; text: string }> = {
  missing: { title: "no recap here", text: "We can't find that quest. The link may be wrong, or it was someone else's quest." },
  unfinished: { title: "not done yet", text: "This quest hasn't finished, so there's no recap yet." },
  offline: { title: "no signal", text: "We couldn't reach Amble. Check your connection and try again." },
  broken: { title: "hmm", text: "Something went wrong loading this recap. Try again in a moment." },
};

function problemFrom(e: unknown): Problem {
  if (!(e instanceof ApiError)) return "broken";
  if (e.status === 0) return "offline";
  if (e.status === 404) return e.message.includes("isn't ready") ? "unfinished" : "missing";
  return "broken";
}

export function RecapScreen() {
  const { runId } = useParams<{ runId: string }>();
  const [recap, setRecap] = useState<Recap | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [kept, setKept] = useState<null | "asked" | "connected">(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  // Finished in the last few hours. Read once, when the page opens.
  const [opened] = useState(() => Date.now());
  const fresh = !!recap && (!recap.completed_at || opened - new Date(recap.completed_at).getTime() < 3 * 3_600_000);
  // Only after mount, and never with reduced motion, so hydration matches.
  const reduce = useReducedMotion();
  const moving = useSyncExternalStore(() => () => {}, () => true, () => false) && !reduce;
  // Opened from your quest history on the You page: go back there, and no chime.
  const fromMe = useSyncExternalStore(() => () => {}, () => new URLSearchParams(location.search).get("from") === "me", () => false);
  const back = fromMe ? "/me" : "/";

  useEffect(() => {
    const quiet = new URLSearchParams(location.search).get("from") === "me";
    api.recap(runId).then((r) => { setRecap(r); setProblem(null); if (!quiet) chime(); }).catch((e) => setProblem(problemFrom(e)));
  }, [runId, attempt]);

  async function stayInTouch() {
    setKept("asked");
    const r = await api.connect(runId).catch(() => null);
    if (r?.connected) setKept("connected");
  }

  const name = recap?.partner?.display_name;
  const km = recap?.distance_m != null ? recap.distance_m / 1000 : null;

  return (
    <AppShell nav={false} wide>
      <Split fill aside={
      <Hero className="pb-8">
        <HeroBar left={<HeroIcon href={back} label={fromMe ? "Back" : "Done"} d={fromMe ? "M15 6l-6 6 6 6" : "M6 6l12 12M18 6L6 18"} />} center="recap" />
        <Hand as="h1" className="px-6 pt-1 text-center text-[40px] leading-none font-bold">
          {problem ? PROBLEMS[problem].title : name ? `you and ${name} did it` : "you did it"}
        </Hand>
        <p className="mx-auto mt-2 max-w-[32ch] px-6 text-center text-[15px] leading-snug text-on-sky/95">
          {recap?.title ? recap.title.charAt(0).toUpperCase() + recap.title.slice(1) : " "}
          {/* Opened from your history, so say when it was. */}
          {fromMe && recap?.completed_at && (
            <> · {new Date(recap.completed_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</>
          )}
        </p>

        {recap && !problem && <MeetPaths partner={name} still={!moving} />}

        {/* the numbers, said once in a handwritten line under the picture */}
        {!problem && recap && (
          <Hand as="p" className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-3 text-[23px] leading-none font-bold">
            <span className="flex items-center gap-1.5"><Ink size={21}>{SunInk}</Ink>{recap.duration_min} min</span>
            {recap.distance_m != null && recap.distance_m >= 50 && <span className="flex items-center gap-1.5"><Ink size={21}>{StepsInk}</Ink>{km! >= 1 ? `${km!.toFixed(1)} km` : `${Math.round(recap.distance_m / 10) * 10} m`}</span>}
            {(recap.coins ?? 0) > 0 && <span className="flex items-center gap-1.5"><Coin size={18} />+{recap.coins} coins</span>}
          </Hand>
        )}
      </Hero>
      }>

      <div className="flex-1 space-y-6 px-4 pt-6">
        {problem && (
          <div className="space-y-3">
            <p className="px-1 text-[17px] leading-relaxed">{PROBLEMS[problem].text}</p>
            {problem === "unfinished" && <ButtonLink size="lg" href={`/quest/${runId}`}>Back to the quest</ButtonLink>}
            {(problem === "offline" || problem === "broken") && (
              <Button size="lg" variant="secondary" className="w-full" onClick={() => { setProblem(null); setAttempt((n) => n + 1); }}>Try again</Button>
            )}
          </div>
        )}
        {!recap && !problem && <Skeleton className="h-28 rounded-[24px]" />}

        {recap && (
          <motion.p
            className="px-1 text-[17px] leading-relaxed text-pretty"
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {recap.summary}
          </motion.p>
        )}

        {recap && <RecapExtras recap={recap} />}

        {/* only right after the quest: "compared with before" means nothing days later */}
        {recap && fresh && <MoodCheck runId={runId} phase="after" onAnswer={setMoodAfter} />}

        {recap?.mood_before != null && (moodAfter ?? recap.mood_after) != null && (
          <MoodShift before={recap.mood_before} after={(moodAfter ?? recap.mood_after)!} />
        )}

        {recap && name && (
          <section className="rounded-[24px] bg-surface p-5 shadow-card">
            <p className="text-[17px] font-semibold">Stay in touch with {name}?</p>
            <p className="mt-1 text-[14px] leading-snug text-ink-muted">You&apos;ll only connect if you both say yes. Next time you&apos;re both free, you can do another one together.</p>
            <div className="mt-4">
              {kept === "connected" || recap.connected ? (
                <p className="flex min-h-14 items-center justify-center gap-2 text-[16px] font-semibold text-success">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  You&apos;re connected with {name}
                </p>
              ) : (
                <MagneticButton onClick={stayInTouch} disabled={kept !== null}>
                  {kept === "asked" ? "Asked…" : `Yes, add ${name}`}
                </MagneticButton>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="px-4 pt-6 pb-6">
        <ButtonLink size="lg" variant="quiet" href={back}>{fromMe ? "Back to you" : "Back to today"}</ButtonLink>
      </div>
      </Split>
    </AppShell>
  );
}
