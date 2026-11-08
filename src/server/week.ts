import "server-only";
import type { WeekDay } from "@/lib/contracts";
import { one, query } from "@/lib/db";

// This week (Monday to Sunday, Calgary time), one row per day: minutes spent on
// finished quests, and minutes you were moving on one (GPS pings). On Tiger Data
// the days and minutes come from TimescaleDB's time_bucket, and the pings come
// from the location_pings hypertable. Embedded Postgres has no TimescaleDB, so it
// uses date_trunc, which gives the same answer.

const TZ = "America/Edmonton";

let timescale: Promise<boolean> | null = null;
export const hasTimescale = () =>
  (timescale ??= one<{ yes: number }>("select 1 as yes from pg_extension where extname = 'timescaledb'")
    .then((r) => !!r)
    .catch(() => false));

function sql(ts: boolean) {
  const day = (col: string) =>
    ts ? `(time_bucket('1 day', ${col}, '${TZ}') at time zone '${TZ}')::date` : `(${col} at time zone '${TZ}')::date`;
  const minute = (col: string) => (ts ? `time_bucket('1 minute', ${col})` : `date_trunc('minute', ${col})`);
  const weekStart = `(date_trunc('week', now() at time zone '${TZ}') at time zone '${TZ}')`;
  return {
    quests: `select ${day("r.completed_at")}::text as day, count(*)::int as quests,
                    round(sum(extract(epoch from r.completed_at - r.started_at)) / 60)::int as minutes
             from run_members m
             join quest_runs r on r.id = m.run_id
             where m.user_id = $1 and r.status = 'completed' and r.completed_at >= ${weekStart}
               and exists (select 1 from submissions s where s.run_id = r.id and s.user_id = m.user_id and s.verdict = 'approved')
             group by 1`,
    moving: `select ${day("p.time")}::text as day, count(distinct ${minute("p.time")})::int as minutes
             from location_pings p
             where p.user_id = $1 and p.time >= ${weekStart}
             group by 1`,
    days: `select (date_trunc('week', now() at time zone '${TZ}')::date + i)::text as day from generate_series(0, 6) i`,
  };
}

async function run(ts: boolean, userId: string): Promise<WeekDay[]> {
  const q = sql(ts);
  const [days, quests, moving] = await Promise.all([
    query<{ day: string }>(q.days),
    query<{ day: string; minutes: number; quests: number }>(q.quests, [userId]),
    query<{ day: string; minutes: number }>(q.moving, [userId]),
  ]);
  const byDay = (rows: { day: string; minutes: number }[]) => new Map(rows.map((r) => [r.day, r.minutes]));
  const questMin = byDay(quests);
  const movingMin = byDay(moving);
  const questCount = new Map(quests.map((r) => [r.day, r.quests]));
  return days.map(({ day }) => ({ day, quests: questCount.get(day) ?? 0, quest_minutes: questMin.get(day) ?? 0, moving_minutes: movingMin.get(day) ?? 0 }));
}

export async function weekDays(userId: string): Promise<WeekDay[]> {
  if (await hasTimescale()) {
    try {
      return await run(true, userId);
    } catch (e) {
      // Never let the time-series query take the You page down.
      console.error("time_bucket week failed, using date_trunc:", (e as Error).message);
    }
  }
  return run(false, userId);
}
