"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Dashboard, User } from "@/lib/contracts";
import { distance, shortDate } from "@/lib/format";
import { AppShell, TopBar } from "@/components/ui/app-shell";
import { Card, Skeleton, Stat } from "@/components/ui/card";
import { QuestIcon } from "@/components/ui/quest-icon";
import { HumanMetrics, ProfileLinks } from "./human-metrics";

export function DashboardScreen() {
  const [me, setMe] = useState<User | null>(null);
  const [d, setD] = useState<Dashboard | null>(null);

  useEffect(() => {
    api.me().then(setMe).catch(() => {});
    api.dashboard().then(setD).catch(() => {});
  }, []);

  return (
    <AppShell>
      <TopBar title={me ? me.display_name.toLowerCase() : "you"} />
      <div className="space-y-5 px-4">
        {!d ? (
          <Skeleton className="h-40 w-full rounded-card" />
        ) : (
          <>
            <HumanMetrics d={d} />
            <Card className="grid grid-cols-2 gap-x-4 gap-y-5 p-5">
              <Stat label="quests done" value={d.quests_done} />
              <Stat label="moved" value={d.km_moved} unit="km" />
              <Stat label="people met" value={d.people_met} />
              <Stat label="coins" value={d.coins} />
            </Card>
            <p className="px-1 text-sm text-ink-muted">
              {d.minutes_outside} minutes outside so far{d.streak_days > 1 ? `, ${d.streak_days} days in a row` : ""}.
            </p>
            <section>
              <h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-muted">recent quests</h2>
              <Card className="divide-y divide-line/70 overflow-hidden">
                {d.history.map((h) => (
                  <div key={h.run_id} className="flex items-center gap-3 px-4 py-3">
                    <QuestIcon type={h.quest.type} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{h.quest.title}</div>
                      <div className="truncate text-[13px] text-ink-muted">
                        {shortDate(h.completed_at)} · {h.partner ? `with ${h.partner.display_name}` : "solo"} · {distance(h.distance_m)}
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold text-coin tabular-nums">+{h.coins}</span>
                  </div>
                ))}
              </Card>
            </section>
            <ProfileLinks />
          </>
        )}
      </div>
    </AppShell>
  );
}
