"use client";
import Link from "next/link";
import type { Dashboard } from "@/lib/contracts";
import { Card, Stat } from "@/components/ui/card";

// The numbers that matter most, ahead of coins. docs/JUDGING.md says why each
// one is here. They're private and never ranked.
export function HumanMetrics({ d }: { d: Dashboard }) {
  const percent = Math.min(100, Math.round((d.active_minutes_week / d.weekly_goal_min) * 100));
  const lift = d.mood.before_avg != null && d.mood.after_avg != null ? d.mood.after_avg - d.mood.before_avg : null;

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">time outside this week</p>
          <p className="text-sm text-ink-muted tabular-nums">{d.active_minutes_week} of {d.weekly_goal_min} min</p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sunken" role="img" aria-label={`${percent} percent of the weekly guideline`}>
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-[13px] text-ink-muted">150 minutes a week is the Canadian guideline. a quiet week is fine.</p>
      </Card>

      {d.familiar_faces.length > 0 && (
        <Card className="p-4">
          <p className="font-semibold">familiar faces</p>
          <ul className="mt-2 space-y-1.5">
            {d.familiar_faces.map((f) => (
              <li key={f.display_name} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-semibold">{f.display_name}</span>
                <span className="shrink-0 text-ink-muted tabular-nums">{f.quests_together} quests, {f.hours_together} h together</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {d.small_hellos.length > 0 && (
        <Card className="p-4">
          <p className="font-semibold">small hellos</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
            {d.small_hellos.slice(0, 3).map((h) => (
              <li key={h.run_id}>{h.quest_title} with {h.display_name}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="grid grid-cols-2 gap-4 p-4">
        <Stat label="new places" value={d.new_places} />
        {lift != null ? (
          <Stat label="mood after quests" value={`${lift >= 0 ? "+" : ""}${lift.toFixed(1)}`} />
        ) : (
          <Stat label="mood check-ins" value={d.mood.checkins} />
        )}
      </Card>
    </div>
  );
}

export function ProfileLinks() {
  return (
    <nav aria-label="your settings" className="flex gap-4 px-1 pb-6 text-sm font-semibold text-ink-muted">
      <Link href="/welcome" className="min-h-11 content-center underline-offset-2 hover:underline">comfort settings</Link>
      <Link href="/privacy" className="min-h-11 content-center underline-offset-2 hover:underline">your data</Link>
    </nav>
  );
}
