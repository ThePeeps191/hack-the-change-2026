"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Quest, QuestType } from "@/lib/contracts";
import { AppShell, TopBar } from "@/components/ui/app-shell";
import { Card, Skeleton } from "@/components/ui/card";
import { QuestIcon, questTypeLabel } from "@/components/ui/quest-icon";
import { QuestRow } from "@/features/quests/quest-row";
import { MiniMap } from "./mini-map";

const filters: (QuestType | "all")[] = ["all", "local", "event", "anywhere"];

export function MapScreen() {
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [filter, setFilter] = useState<QuestType | "all">("all");

  useEffect(() => {
    api.quests().then(setQuests).catch(() => setQuests([]));
  }, []);

  const shown = (quests ?? []).filter((q) => filter === "all" || q.type === filter);
  const placed = shown.filter((q) => q.lat != null && q.lng != null);

  return (
    <AppShell>
      <TopBar title="around you" />
      <div className="space-y-3 px-4">
        <div className="flex gap-2 overflow-x-auto" role="tablist">
          {filters.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-chip px-3.5 text-sm font-semibold ${filter === f ? "bg-ink text-canvas" : "bg-surface text-ink-muted border border-line"}`}
            >
              {f !== "all" && <QuestIcon type={f} size={16} />}
              {f === "all" ? "everything" : questTypeLabel[f]}
            </button>
          ))}
        </div>
        {quests === null ? (
          <Skeleton className="aspect-square w-full rounded-card" />
        ) : (
          <MiniMap
            pins={placed.map((q) => ({ id: q.id, lat: q.lat!, lng: q.lng!, node: <QuestIcon type={q.type} size={30} />, label: q.place_name ?? undefined }))}
          />
        )}
        <Card className="divide-y divide-line/70 overflow-hidden">
          {shown.map((q) => <QuestRow key={q.id} quest={q} />)}
          {quests !== null && shown.length === 0 && <p className="px-4 py-5 text-sm text-ink-muted">nothing of this kind nearby right now.</p>}
        </Card>
      </div>
    </AppShell>
  );
}
