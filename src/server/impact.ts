import "server-only";
import type { Impact } from "@/lib/contracts";
import { one } from "@/lib/db";

// Community-wide totals for the public /impact page. Counts only: no names, no
// places, nothing about any one person.
//
// Who counts:
// - Bots (Priya, the practice partner) never count. A quest with a bot isn't
//   two people meeting, and her minutes aren't anyone's minutes outside.
// - "Real" people are everyone else except the made-up seed people (seed|),
//   the mock login (mock|) and judges on the demo login (demo|).
// If no real person has finished a quest yet, we show the totals with the demo
// accounts included instead, and say so on the page ("demo data").

type Totals = Omit<Impact, "source" | "generated_at">;

const REAL_ONLY = `not u.is_bot and u.auth0_sub !~ '^(seed|mock|demo|bot)\\|'`;
const NOT_BOT = `not u.is_bot`;

async function totals(realOnly: boolean): Promise<Totals> {
  const who = realOnly ? REAL_ONLY : NOT_BOT;
  const row = await one<{
    quests: number;
    minutes: number;
    metres: number;
    met: number;
    familiar: number;
    checkins: number;
    better: number;
  }>(
    `with people as (select u.id from users u where ${who}),
     done as (
       select r.id as run_id, r.mode, m.user_id, coalesce(m.distance_m, 0) as metres,
              extract(epoch from (r.completed_at - r.started_at)) / 60 as minutes
       from quest_runs r
       join run_members m on m.run_id = r.id
       where r.status = 'completed' and r.completed_at is not null
         and m.user_id in (select id from people)
     ),
     pairs as (
       select a.user_id as u1, b.user_id as u2, count(distinct a.run_id) as times
       from done a join done b on b.run_id = a.run_id and a.user_id < b.user_id
       where a.mode = 'pair'
       group by a.user_id, b.user_id
     ),
     after as (
       select c.mood from checkins c where c.phase = 'after' and c.user_id in (select id from people)
     )
     select
       (select count(distinct run_id) from done)::int as quests,
       (select coalesce(round(sum(minutes)), 0) from done)::int as minutes,
       (select coalesce(sum(metres), 0) from done)::int as metres,
       (select count(*) from (select u1 from pairs union select u2 from pairs) x)::int as met,
       (select count(*) from pairs where times >= 2)::int as familiar,
       (select count(*) from after)::int as checkins,
       (select count(*) from after where mood >= 4)::int as better`,
  );
  const r = row ?? { quests: 0, minutes: 0, metres: 0, met: 0, familiar: 0, checkins: 0, better: 0 };
  return {
    quests_completed: r.quests,
    minutes_outside: r.minutes,
    km_walked: Math.round(r.metres / 100) / 10,
    people_met_someone_new: r.met,
    familiar_pairs: r.familiar,
    checkins_after: r.checkins,
    felt_better_pct: r.checkins > 0 ? Math.round((r.better / r.checkins) * 100) : null,
  };
}

export async function getImpact(): Promise<Impact> {
  const real = await totals(true);
  const source = real.quests_completed > 0 ? "real" : "demo";
  return {
    source,
    ...(source === "real" ? real : await totals(false)),
    generated_at: new Date().toISOString(),
  };
}
