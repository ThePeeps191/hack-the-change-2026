"use client";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RunMember } from "@/lib/contracts";
import { usePoll } from "@/lib/use-poll";
import { Split } from "@/components/ui/split";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { MoodCheck } from "@/features/checkin/mood-check";
import { FinishNow } from "./finish-now";
import { ReportSheet } from "./report-sheet";
import { RunTracker } from "./run-tracker";
import { Odometer } from "@/components/ui/odometer";
import { categoryLabel, categoryOf, CategoryIcon, Coin } from "@/components/ui/quest-glyph";
import { Avatar } from "@/components/ui/avatar";

const back = "M14.5 5.5L8 12l6.5 6.5";

// Seconds left, ticking once a second. Starts null so server and client agree.
function useSecondsLeft(endsAt: string | undefined) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const end = Date.parse(endsAt);
    const update = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return left;
}

function memberLine(m: RunMember, you: boolean, placed: boolean) {
  const who = you ? "You" : m.display_name;
  if (m.verdict?.status === "pending") return `${who}: checking the proof`;
  if (m.submitted) return `${who}: proof's in`;
  return `${who}: ${placed ? "on the way" : "not yet"}`;
}

export function QuestScreen() {
  const { runId } = useParams<{ runId: string }>();
  const { data: run, error } = usePoll(() => api.run(runId));
  const left = useSecondsLeft(run?.ends_at);

  if (!run) {
    return (
      <AppShell nav={false} wide>
        <Split fill aside={
        <Hero className="pb-10">
          <HeroBar left={<HeroIcon href="/" label="Back" d={back} />} center="your quest" />
          <div className="grid h-[150px] place-items-center">
            {error ? <p className="px-8 text-center text-[15px] text-on-sky/90">We can&apos;t find this quest. It may have ended.</p> : <Skeleton className="h-16 w-28 rounded-2xl opacity-40" />}
          </div>
        </Hero>
        }>
        {!error && <div className="-mt-8 px-4 lg:mt-0"><Skeleton className="h-64 rounded-[28px]" /></div>}
        </Split>
      </AppShell>
    );
  }

  const q = run.quest;
  const [you, ...others] = run.members;
  const partner = others[0];
  const active = run.status === "active";
  const pending = you?.verdict?.status === "pending";
  const late = left != null && left < 120;
  const mapsUrl = q.lat != null && q.lng != null ? `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}&travelmode=walking` : null;

  return (
    <AppShell nav={false} wide>
      <RunTracker runId={run.id} active={active} />
      <Split fill aside={
      <Hero className="pb-14">
        <HeroBar
          left={<HeroIcon href="/" label="Back" d={back} />}
          center={run.mode === "pair" && partner ? `with ${partner.display_name}` : others.length > 1 ? "with your crew" : others.length === 1 ? `with ${partner?.display_name}` : run.mode === "claim" ? "claim attempt" : "on your own"}
        />
        <div className="flex flex-col items-center pt-2" role={active ? "timer" : undefined} aria-label={active && left != null ? `${Math.ceil(left / 60)} minutes left` : undefined}>
          {active ? (
            <>
              <div className="numeral text-[84px] leading-none">
                {left == null ? (
                  <span className="opacity-0">00</span>
                ) : late ? (
                  `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`
                ) : (
                  <Odometer value={Math.ceil(left / 60)} />
                )}
              </div>
              <Hand className="mt-1 text-[24px] leading-none font-bold">{left === 0 ? "time's up, no rush" : late ? "nearly there" : "minutes, no rush"}</Hand>
            </>
          ) : (
            <Hand className="py-6 text-[38px] leading-none font-bold">
              {run.status === "completed" ? "you did it" : "time ran out"}
            </Hand>
          )}
        </div>
      </Hero>
      }>

      <motion.div
        className="relative z-10 -mt-10 px-4 lg:mt-0"
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      >
        <div className="glass-card rounded-[28px] text-ink">
          <article className="relative rounded-[28px] p-5">
            <div className="flex items-center gap-2 text-[13px] text-ink-muted">
              <CategoryIcon category={categoryOf(q)} size={20} className="text-ink" />
              <span>{categoryLabel[categoryOf(q)]}<span className="text-ink-faint"> · {q.proof} proof</span></span>
              <span className="ml-auto flex items-center gap-1 font-semibold text-ink tabular-nums"><Coin size={14} />{q.coins}<span className="sr-only"> coins</span></span>
            </div>
            <h1 className="name-serif mt-3 text-[28px] leading-[1.1] text-pretty">
              {q.title.charAt(0).toUpperCase() + q.title.slice(1)}
            </h1>
            <p className="mt-2.5 text-[16px] leading-relaxed text-ink-muted">{q.description}</p>
            {q.place_name && (
              <div className="mt-5 flex items-center gap-3 border-t border-[var(--hairline)] pt-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-faint" aria-hidden>
                  <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
                  <circle cx="12" cy="10" r="2.2" />
                </svg>
                <span className="flex-1 text-[15px] font-medium">{q.place_name}</span>
                {mapsUrl && active && !you?.submitted && (
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center px-1 text-[15px] font-semibold text-accent">
                    Walk there
                  </a>
                )}
              </div>
            )}
            {q.sources.length > 0 && (
              <p className="mt-2 text-[12px] leading-snug text-ink-faint">
                From{" "}
                {q.sources.map((s, i) => (
                  <span key={s.uri}>
                    {i > 0 && ", "}
                    <a href={s.uri} className="underline" target="_blank" rel="noreferrer">{s.title}</a>
                  </span>
                ))}
              </p>
            )}
            <ul className="mt-4 space-y-2 border-t border-[var(--hairline)] pt-4" aria-label="Who's done what">
              {run.members.map((m, i) => (
                <li key={m.user_id} className="flex items-center gap-3 text-[14px] text-ink-muted">
                  <span className="relative">
                    <Avatar name={m.display_name} size={30} />
                    {(m.submitted || m.verdict?.status === "pending") && (
                      <span className={`absolute -right-1 -bottom-1 grid size-[15px] place-items-center rounded-full ring-2 ring-[var(--color-surface)] ${m.submitted ? "bg-accent text-on-accent" : "bg-accent"}`} aria-hidden>
                        {m.submitted ? (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.3l2.3 2.2 4.7-5" /></svg>
                        ) : (
                          <span className="size-[5px] animate-ping rounded-full bg-white" />
                        )}
                      </span>
                    )}
                  </span>
                  {memberLine(m, i === 0, q.place_name != null)}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </motion.div>

      {active && <div className="px-4 pt-5"><MoodCheck runId={run.id} phase="before" /></div>}

      {error && <div className="pt-2"><Notice tone="warning">Signal&apos;s patchy. We&apos;ll keep trying.</Notice></div>}

      {/* The main action stays in reach at the bottom of the screen, on a band
          of page colour that fades out above it, so whatever scrolls under it
          dissolves instead of being cut off. */}
      <div className="sticky bottom-0 z-20 mt-auto space-y-1 bg-gradient-to-t from-canvas from-65% to-transparent px-4 pt-14 pb-[max(16px,env(safe-area-inset-bottom))] lg:static lg:bg-none lg:pt-6 lg:pb-0">
        {run.status === "completed" && run.mode === "claim" ? (
          // A Claim challenge isn't done until the result is in, so that comes first.
          <ButtonLink size="lg" href={`/claim?zone=${run.zone_id}`}>Send your result</ButtonLink>
        ) : run.status === "completed" ? (
          <ButtonLink size="lg" href={`/recap/${run.id}`}>See how it went</ButtonLink>
        ) : run.status === "expired" ? (
          <>
            <p className="pb-3 text-center text-[15px] text-ink-muted">That&apos;s fine. The walk still counts.</p>
            <ButtonLink size="lg" href="/">Back to today</ButtonLink>
          </>
        ) : you?.submitted && run.mode === "crew" && run.crew_id ? (
          <FinishNow runId={run.id} />
        ) : you?.submitted ? (
          <p className="py-3 text-center text-[15px] text-ink-muted">Your proof is in. Waiting on {partner?.display_name ?? "your partner"}.</p>
        ) : (
          <ButtonLink size="lg" href={`/quest/${run.id}/proof`}>{pending ? "Checking your proof…" : "Add our proof"}</ButtonLink>
        )}
        {active && run.mode === "pair" && partner && <ReportSheet runId={run.id} reportedId={partner.user_id} />}
      </div>
      </Split>
    </AppShell>
  );
}
