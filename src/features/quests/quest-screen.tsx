"use client";
import { BorderBeam } from "border-beam";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RunMember } from "@/lib/contracts";
import { usePoll } from "@/lib/use-poll";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { Odometer } from "@/components/ui/odometer";
import { QuestIcon, questTypeLabel } from "@/components/ui/quest-icon";

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

function memberLine(m: RunMember, you: boolean) {
  const who = you ? "You" : m.display_name;
  if (m.verdict?.status === "pending") return `${who}: checking the proof`;
  if (m.submitted) return `${who}: proof's in`;
  return `${who}: on the way`;
}

export function QuestScreen() {
  const { runId } = useParams<{ runId: string }>();
  const { data: run, error } = usePoll(() => api.run(runId));
  const left = useSecondsLeft(run?.ends_at);

  if (!run) {
    return (
      <AppShell nav={false}>
        <Hero className="pb-10">
          <HeroBar left={<HeroIcon href="/" label="Back" d={back} />} center="your quest" />
          <div className="grid h-[150px] place-items-center">
            {error ? <p className="px-8 text-center text-[15px] text-on-sky/90">We can&apos;t find this quest. It may have ended.</p> : <Skeleton className="h-16 w-28 rounded-2xl opacity-40" />}
          </div>
        </Hero>
        {!error && <div className="-mt-8 px-4"><Skeleton className="h-64 rounded-[28px]" /></div>}
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
    <AppShell nav={false}>
      <Hero className="pb-14">
        <HeroBar
          left={<HeroIcon href="/" label="Back" d={back} />}
          center={partner ? `with ${partner.display_name}` : "your quest"}
        />
        <div className="flex flex-col items-center pt-2" role="timer" aria-label={left != null ? `${Math.ceil(left / 60)} minutes left` : undefined}>
          {active ? (
            <>
              <div className="font-[family-name:var(--font-display)] text-[84px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
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
            <Hand as="h1" className="py-6 text-[38px] leading-none font-bold">
              {run.status === "completed" ? "you did it" : "time ran out"}
            </Hand>
          )}
        </div>
      </Hero>

      <motion.div
        className="relative z-10 -mt-10 px-4"
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      >
        <BorderBeam size="md" theme="auto" colorVariant="ocean" duration={7} strength={0.7} borderRadius={28} active={active} className="rounded-[28px]">
          <article className="rounded-[28px] bg-surface p-5 shadow-lift">
            <div className="flex items-center gap-2 text-[13px] text-ink-muted">
              <QuestIcon type={q.type} size={8} />
              <span>{questTypeLabel[q.type]}</span>
              <span className="text-ink-faint">· {q.proof} proof</span>
              <span className="ml-auto font-semibold text-ink tabular-nums">+{q.coins}</span>
            </div>
            <h1 className="mt-3 text-[26px] leading-[1.12] font-semibold tracking-[-0.02em] text-pretty">
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
                {mapsUrl && (
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
          </article>
        </BorderBeam>
      </motion.div>

      <ul className="space-y-1 px-6 pt-5" aria-label="Who's done what">
        {run.members.map((m, i) => (
          <li key={m.user_id} className="flex items-center gap-2.5 text-[15px] text-ink-muted">
            <span className={`size-2 rounded-full ${m.submitted ? "bg-success" : m.verdict?.status === "pending" ? "bg-accent animate-pulse" : "bg-line"}`} />
            {memberLine(m, i === 0)}
          </li>
        ))}
      </ul>

      {error && <div className="pt-2"><Notice tone="warning">Signal&apos;s patchy. We&apos;ll keep trying.</Notice></div>}

      <div className="mt-auto space-y-1 px-4 pt-8 pb-6">
        {run.status === "completed" ? (
          <ButtonLink size="lg" href={`/recap/${run.id}`}>See how it went</ButtonLink>
        ) : run.status === "expired" ? (
          <>
            <p className="pb-3 text-center text-[15px] text-ink-muted">That&apos;s fine. The walk still counts.</p>
            <ButtonLink size="lg" href="/">Back to today</ButtonLink>
          </>
        ) : you?.submitted ? (
          <p className="py-3 text-center text-[15px] text-ink-muted">Your proof is in. Waiting on {partner?.display_name ?? "your partner"}.</p>
        ) : (
          <ButtonLink size="lg" href={`/quest/${run.id}/proof`}>{pending ? "Checking your proof…" : "Add our proof"}</ButtonLink>
        )}
      </div>
    </AppShell>
  );
}
