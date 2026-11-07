"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Crew, LeaderboardEntry } from "@/lib/contracts";
import { AppShell, TopBar } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, Chip, Skeleton } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";

export function CrewScreen() {
  const [crew, setCrew] = useState<Crew | null | undefined>(undefined);
  const [board, setBoard] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    api.crews().then((c) => setCrew(c[0] ?? null)).catch(() => setCrew(null));
    api.leaderboard().then(setBoard).catch(() => setBoard([]));
  }, []);

  return (
    <AppShell>
      <TopBar title="crew" right={crew && <Chip>code {crew.invite_code}</Chip>} />
      <div className="space-y-5 px-4">
        {crew === undefined && <Skeleton className="h-36 w-full rounded-card" />}
        {crew === null && (
          <Card className="flex flex-col items-center p-6 text-center">
            <Mascot mood="sleepy" size={64} />
            <p className="mt-3 font-semibold">no crew yet</p>
            <p className="mt-1 text-sm text-ink-muted">start one and send the link to a few friends.</p>
          </Card>
        )}
        {crew && (
          <section>
            <div className="flex items-baseline justify-between px-1">
              <h1 className="text-2xl font-extrabold tracking-tight">{crew.name}</h1>
              <span className="text-sm font-semibold text-coin tabular-nums">{crew.coins} coins</span>
            </div>
            <Card className="mt-2 divide-y divide-line/70 overflow-hidden">
              {[...crew.members].sort((a, b) => b.coins - a.coins).map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent-strong">{m.display_name[0]}</span>
                  <span className="flex-1 font-semibold">{m.display_name}</span>
                  <span className="text-sm text-ink-muted tabular-nums">{m.coins}</span>
                </div>
              ))}
            </Card>
            <ButtonLink href="/claim" variant="secondary" className="mt-3 w-full">open claim map</ButtonLink>
          </section>
        )}

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-muted">crews this week</h2>
          <Card className="overflow-hidden">
            <ol className="divide-y divide-line/70">
              {(board ?? []).map((e) => {
                const ours = crew && e.id === crew.id;
                return (
                  <li key={e.id} className={`flex items-center gap-3 px-4 py-3 ${ours ? "bg-accent-soft/60" : ""}`}>
                    <span className="w-5 text-center font-bold text-ink-muted tabular-nums">{e.rank}</span>
                    <span className="flex-1 truncate font-semibold">{e.name}</span>
                    {e.delta ? <span className="text-[13px] font-semibold text-success tabular-nums">+{e.delta}</span> : null}
                    <span className="w-14 text-right font-semibold tabular-nums">{e.coins}</span>
                  </li>
                );
              })}
              {board === null && [0, 1, 2].map((i) => <li key={i} className="px-4 py-3"><Skeleton className="h-5 w-full" /></li>)}
            </ol>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
