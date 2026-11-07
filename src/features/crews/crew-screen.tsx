"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Crew, LeaderboardEntry } from "@/lib/contracts";
import { tick } from "@/lib/feedback";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Skeleton } from "@/components/ui/card";
import { dusk, Hero, HeroBar, Stars } from "@/components/ui/hero";
import { Odometer } from "@/components/ui/odometer";
import { AnywhereQuests, NoCrewActions, StartQuestCard } from "./crew-actions";

function Avatar({ name, ours = false }: { name: string; ours?: boolean }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-semibold ${ours ? "bg-accent text-on-accent" : "bg-sunken text-ink-muted"}`}>
      {name[0]?.toUpperCase()}
    </span>
  );
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
});

export function CrewScreen() {
  const [crew, setCrew] = useState<Crew | null | undefined>(undefined);
  const [board, setBoard] = useState<LeaderboardEntry[] | null>(null);
  const [copied, setCopied] = useState(false);

  const reload = () => {
    api.crews().then((c) => setCrew(c[0] ?? null)).catch(() => setCrew(null));
    api.leaderboard().then(setBoard).catch(() => setBoard([]));
  };

  useEffect(reload, []);

  async function copy() {
    if (!crew) return;
    tick(0.8);
    const link = `${location.origin}/join/${crew.invite_code}`;
    try {
      if (navigator.share) await navigator.share({ title: `Join ${crew.name}`, url: link });
      else await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  const members = crew ? [...crew.members].sort((a, b) => b.coins - a.coins) : [];

  return (
    <AppShell>
      <Hero className="pb-8">
        <HeroBar
          center="crew"
          right={
            crew && (
              <button onClick={copy} className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-on-sky/95 hover:bg-white/15">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 4v11M7.5 8.5L12 4l4.5 4.5M5 14v5h14v-5" />
                </svg>
                {copied ? "Copied" : "Invite"}
              </button>
            )
          }
        />
        {crew === undefined ? (
          <div className="flex flex-col items-center gap-3 py-6"><Skeleton className="h-9 w-40 rounded-xl opacity-40" /><Skeleton className="h-14 w-24 rounded-xl opacity-40" /></div>
        ) : crew === null ? (
          <div className="px-6 py-6 text-center">
            <Hand as="h1" className="text-[38px] leading-none font-bold">no crew yet</Hand>
            <p className="mx-auto mt-2 max-w-[30ch] text-[15px] text-on-sky/85">Start one and send the link to a few friends. Crews do longer games together.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 pt-1 text-center">
            <Hand as="h1" className="text-[38px] leading-none font-bold">{crew.name}</Hand>
            <Odometer value={crew.coins} delay={150} className="mt-3 font-[family-name:var(--font-display)] text-[64px] leading-none font-semibold tracking-[-0.04em]" />
            <p className="mt-1 text-[14px] font-medium text-on-sky/85">
              coins together{crew.rating != null && <> · crew rating {Math.round(crew.rating)}</>}
            </p>
          </div>
        )}
      </Hero>

      <div className="space-y-7 px-4 pt-6">
        {crew === null && <NoCrewActions onDone={reload} />}
        {crew && (
          <motion.div {...rise(0)}>
            <Link
              href="/claim"
              onClick={() => tick(0.6)}
              className="group relative block overflow-hidden rounded-[24px] p-5 text-white shadow-lift transition-transform active:scale-[0.985]"
              style={{ background: dusk }}
            >
              <Stars />
              <div className="relative flex items-center gap-2 text-[13px] text-white/75">
                <span className="size-2 rounded-full bg-accent" />
                <span className="size-2 rounded-full bg-anywhere" />
                <span>Claim, live this week</span>
              </div>
              <p className="relative mt-2 text-[20px] leading-snug font-semibold">Hold spots on campus by beating their challenge.</p>
              <p className="relative mt-3 flex items-center gap-1 text-[15px] font-semibold">
                Open the map
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="transition-transform group-hover:translate-x-0.5"><path d="M9 5l7 7-7 7" /></svg>
              </p>
            </Link>
          </motion.div>
        )}

        {crew && (
          <section aria-labelledby="who">
            <Hand as="h2" className="mb-2.5 px-1 text-[26px] leading-none font-bold"><span id="who">who&apos;s in</span></Hand>
            <ul className="rows overflow-hidden rounded-[24px] bg-surface shadow-card">
              {members.map((m, i) => (
                <motion.li key={m.user_id} {...rise(i + 1)} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={m.display_name} />
                  <span className="flex-1 text-[16px] font-medium">{m.display_name}</span>
                  <Odometer value={m.coins} delay={200 + i * 80} className="text-[15px] font-semibold text-ink-muted" />
                </motion.li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="week">
          <Hand as="h2" className="mb-2.5 px-1 text-[26px] leading-none font-bold"><span id="week">this week</span></Hand>
          <ol className="rows overflow-hidden rounded-[24px] bg-surface shadow-card">
            {board === null && [0, 1, 2].map((i) => <li key={i} className="px-4 py-4"><Skeleton className="h-5 w-full" /></li>)}
            {(board ?? []).map((e, i) => {
              const ours = !!crew && e.id === crew.id;
              return (
                <motion.li key={e.id} {...rise(i)} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-6 text-center text-[17px] font-semibold tabular-nums ${e.rank === 1 ? "text-ink" : "text-ink-faint"}`}>{e.rank}</span>
                  <Avatar name={e.name} ours={ours} />
                  <span className={`flex-1 truncate text-[16px] ${ours ? "font-semibold" : "font-medium"}`}>{e.name}</span>
                  {e.delta ? <span className="text-[13px] font-semibold text-success tabular-nums">+{e.delta}</span> : null}
                  <Odometer value={e.coins} delay={250 + i * 80} className="w-14 justify-end text-right text-[16px] font-semibold" />
                </motion.li>
              );
            })}
          </ol>
        </section>

        {crew && crew.shared_quests.length > 0 && (
          <section aria-labelledby="shared">
            <Hand as="h2" className="mb-2.5 px-1 text-[26px] leading-none font-bold"><span id="shared">do one together</span></Hand>
            <div className="flex flex-col gap-2.5">
              {crew.shared_quests.map((q) => <StartQuestCard key={q.id} crewId={crew.id} quest={q} />)}
            </div>
          </section>
        )}

        {crew && <AnywhereQuests crew={crew} onChange={reload} />}
      </div>
    </AppShell>
  );
}
