import "server-only";
import type { Dashboard, HistoryItem, User } from "@/lib/contracts";
import { one, query } from "@/lib/db";
import { getQuest } from "./quests";

// The 150 minutes a week from the Canadian 24-Hour Movement Guidelines.
const WEEKLY_GOAL_MIN = 150;
const FAMILIAR_AFTER = 2;

type DoneRun = {
  run_id: string;
  quest_id: string;
  place_name: string | null;
  lat: number | null;
  lng: number | null;
  started_at: Date;
  completed_at: Date;
  distance_m: number | null;
  coins: number | null;
};

// Everything here is private to you and never ranked. See docs/JUDGING.md for
// why these are the numbers we show.
export async function getDashboard(user: User): Promise<Dashboard> {
  const done = await query<DoneRun>(
    `select r.id as run_id, r.quest_id, q.place_name, q.lat, q.lng, r.started_at, r.completed_at, m.distance_m, e.amount as coins
     from run_members m
     join quest_runs r on r.id = m.run_id
     join quests q on q.id = r.quest_id
     left join coin_events e on e.run_id = r.id and e.user_id = m.user_id
     where m.user_id = $1 and r.status = 'completed'
       -- Only quests you did yourself: not one your partner finished without you.
       and exists (select 1 from submissions s where s.run_id = r.id and s.user_id = m.user_id and s.verdict = 'approved')
     order by r.completed_at desc`,
    [user.id],
  );

  const together = await query<{ run_id: string; user_id: string; display_name: string; avatar_url: string | null; started_at: Date; completed_at: Date; title: string }>(
    `select r.id as run_id, o.user_id, u.display_name, u.avatar_url, r.started_at, r.completed_at, q.title
     from run_members m
     join run_members o on o.run_id = m.run_id and o.user_id <> m.user_id
     join users u on u.id = o.user_id
     join quest_runs r on r.id = m.run_id
     join quests q on q.id = r.quest_id
     where m.user_id = $1 and r.status = 'completed' and r.mode = 'pair'
       and exists (select 1 from submissions s where s.run_id = r.id and s.user_id = m.user_id and s.verdict = 'approved')
     order by r.completed_at`,
    [user.id],
  );

  const minutes = (r: { started_at: Date; completed_at: Date }) => (r.completed_at.getTime() - r.started_at.getTime()) / 60_000;

  const byPerson = new Map<string, typeof together>();
  for (const t of together) byPerson.set(t.user_id, [...(byPerson.get(t.user_id) ?? []), t]);

  const familiar = [...byPerson.values()]
    .filter((runs) => runs.length >= FAMILIAR_AFTER)
    .map((runs) => ({
      display_name: runs[0].display_name,
      avatar_url: runs[0].avatar_url,
      quests_together: runs.length,
      minutes_together: Math.round(runs.reduce((sum, r) => sum + minutes(r), 0)),
      last_seen: runs.at(-1)!.completed_at.toISOString(),
    }))
    .sort((a, b) => b.quests_together - a.quests_together);

  // The first quest with each person, newest first.
  const hellos = [...byPerson.values()]
    .map((runs) => runs[0])
    .sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime())
    .slice(0, 10)
    .map((r) => ({ run_id: r.run_id, display_name: r.display_name, quest_title: r.title, at: r.completed_at.toISOString() }));

  const weekAgo = Date.now() - 7 * 86_400_000;
  const activeWeek = done.filter((r) => r.completed_at.getTime() > weekAgo).reduce((sum, r) => sum + minutes(r), 0);

  // "How do you feel?" after a quest is relative to before: 5 better, 3 the
  // same, 1 worse. This counts how often you came back better.
  const mood = await one<{ after_better: number; checkins: number }>(
    `select count(*)::int as checkins, (count(*) filter (where mood >= 4))::int as after_better
     from checkins where user_id = $1 and phase = 'after'`,
    [user.id],
  );

  const sample = await one<{ n: number }>(
    "select count(*)::int as n from run_members m join quest_runs r on r.id = m.run_id where m.user_id = $1 and r.sample",
    [user.id],
  );

  // Each place once, at the first visit, for the map.
  const firstVisits = new Map<string, { name: string; lat: number; lng: number; first_visit: string }>();
  for (const r of [...done].reverse()) {
    if (!r.place_name || r.lat == null || r.lng == null || firstVisits.has(r.place_name)) continue;
    firstVisits.set(r.place_name, { name: r.place_name, lat: r.lat, lng: r.lng, first_visit: r.completed_at.toISOString() });
  }

  const partnerByRun = new Map(together.map((t) => [t.run_id, t]));
  const history: HistoryItem[] = await Promise.all(
    done.slice(0, 20).map(async (r) => {
      const partner = partnerByRun.get(r.run_id);
      return {
        run_id: r.run_id,
        quest: await getQuest(r.quest_id),
        completed_at: r.completed_at.toISOString(),
        coins: r.coins ?? 0,
        partner: partner ? { display_name: partner.display_name, avatar_url: partner.avatar_url } : null,
        distance_m: r.distance_m ?? 0,
      };
    }),
  );

  return {
    quests_done: done.length,
    km_moved: Math.round(done.reduce((sum, r) => sum + (r.distance_m ?? 0), 0) / 100) / 10,
    people_met: byPerson.size,
    coins: user.coins,
    minutes_outside: Math.round(done.reduce((sum, r) => sum + minutes(r), 0)),
    streak_days: streak(done.map((r) => r.completed_at)),
    history,
    active_minutes_week: Math.round(activeWeek),
    active_goal_minutes: WEEKLY_GOAL_MIN,
    familiar_faces: familiar,
    small_hellos: hellos,
    new_places: [...firstVisits.values()],
    mood: { after_better: mood?.after_better ?? 0, checkins: mood?.checkins ?? 0 },
    sample_quests: sample?.n ?? 0,
  };
}

// Days in a row with a quest, counting back from today or yesterday.
function streak(dates: Date[]) {
  const days = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  const day = (ago: number) => new Date(Date.now() - ago * 86_400_000).toISOString().slice(0, 10);
  let ago = days.has(day(0)) ? 0 : 1;
  let count = 0;
  while (days.has(day(ago))) {
    count++;
    ago++;
  }
  return count;
}
