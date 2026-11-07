"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Card, Chip, Skeleton } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { QuestIcon, questTypeLabel } from "@/components/ui/quest-icon";
import { MoodCheck } from "@/features/checkin/mood-check";
import { GentleTimer } from "./gentle-timer";
import { ReportPanel } from "./report-panel";
import { RunTracker } from "./run-tracker";

export function QuestScreen() {
  const { runId } = useParams<{ runId: string }>();
  const { data: run, error } = usePoll(() => api.run(runId));
  const [reporting, setReporting] = useState(false);

  if (!run) {
    return (
      <AppShell nav={false}>
        <TopBar back="/" title="your quest" />
        <div className="space-y-4 p-4">
          {error ? (
            <Notice tone="warning">we can&apos;t find this quest. it may have ended.</Notice>
          ) : (
            <>
              <Skeleton className="mx-auto size-28 rounded-full" />
              <Skeleton className="h-40 w-full rounded-card" />
            </>
          )}
        </div>
      </AppShell>
    );
  }

  const q = run.quest;
  const [you, ...others] = run.members;
  const partner = others[0];
  const youDone = you?.submitted;
  const pending = you?.verdict?.status === "pending";
  const mapsUrl =
    q.lat != null && q.lng != null ? `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}&travelmode=walking` : null;

  return (
    <AppShell nav={false}>
      <RunTracker runId={run.id} active={run.status === "active"} />
      <TopBar
        back="/"
        title="your quest"
        right={partner && <Chip tone="neutral">with {partner.display_name}</Chip>}
      />

      <div className="flex flex-col items-center gap-2 px-4 pt-2">
        {run.status === "active" && <GentleTimer startedAt={run.started_at} endsAt={run.ends_at} />}
        {run.status === "completed" && <Mascot mood="cheer" size={88} />}
        {run.status === "expired" && <Mascot mood="sleepy" size={88} />}
      </div>

      <div className="px-4 pt-4">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <QuestIcon type={q.type} size={22} />
            <span className="text-[13px] font-semibold text-ink-muted">{questTypeLabel[q.type]} · {q.proof} proof</span>
            <span className="ml-auto text-[13px] font-semibold text-coin tabular-nums">+{q.coins}</span>
          </div>
          <h1 className="mt-3 text-2xl leading-tight font-extrabold tracking-tight">{q.title}</h1>
          <p className="mt-2 leading-relaxed text-ink-muted">{q.description}</p>
          {q.place_name && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-control bg-sunken px-3 py-2.5">
              <span className="text-sm font-semibold">{q.place_name}</span>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent underline-offset-2 hover:underline">
                  walk there
                </a>
              )}
            </div>
          )}
          {q.sources.length > 0 && (
            <p className="mt-3 text-[12px] text-ink-faint">
              sources: {q.sources.map((s) => <a key={s.uri} href={s.uri} className="underline" target="_blank" rel="noreferrer">{s.title}</a>)}
            </p>
          )}
        </Card>

        {run.status === "active" && <div className="mt-3"><MoodCheck runId={run.id} phase="before" /></div>}

        <ul className="mt-3 flex flex-wrap gap-2">
          {run.members.map((m, i) => (
            <li key={m.user_id}>
              <Chip tone={m.submitted ? "success" : "neutral"}>
                {i === 0 ? "you" : m.display_name}: {m.submitted ? "proof in" : m.verdict?.status === "pending" ? "checking" : "not yet"}
              </Chip>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto space-y-2 px-4 pt-6 pb-6">
        {reporting && partner ? (
          <ReportPanel runId={run.id} reportedId={partner.user_id} onClose={() => setReporting(false)} />
        ) : run.status === "completed" ? (
          <ButtonLink size="lg" href={`/recap/${run.id}`}>see how it went</ButtonLink>
        ) : run.status === "expired" ? (
          <>
            <p className="text-center text-sm text-ink-muted">time ran out, and that&apos;s fine. the walk still counts.</p>
            <ButtonLink size="lg" href="/">back home</ButtonLink>
          </>
        ) : youDone ? (
          <p className="rounded-control bg-success-soft px-4 py-3 text-center text-sm font-semibold text-success">your proof is in. waiting on {partner?.display_name ?? "your partner"}…</p>
        ) : (
          <ButtonLink size="lg" href={`/quest/${run.id}/proof`}>{pending ? "checking your proof…" : "add our proof"}</ButtonLink>
        )}
        {run.status === "active" && !reporting && partner && (
          <button className={buttonClass("quiet", "md", "w-full text-sm")} onClick={() => setReporting(true)}>
            report or leave
          </button>
        )}
      </div>
    </AppShell>
  );
}
