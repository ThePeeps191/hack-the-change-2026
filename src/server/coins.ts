import "server-only";
import { one, query } from "@/lib/db";

// Pays a quest's coins once per person per run. The unique index on coin_events
// is what makes a repeat call do nothing.
export async function awardCoins(userId: string, runId: string) {
  const run = await one<{ crew_id: string | null; coins: number }>(
    "select r.crew_id, q.coins from quest_runs r join quests q on q.id = r.quest_id where r.id = $1",
    [runId],
  );
  // Claim challenges pay nothing (coins 0), so they leave no coin event either.
  if (!run || !run.coins) return;
  const inserted = await query(
    `insert into coin_events (user_id, crew_id, run_id, amount) values ($1, $2, $3, $4)
     on conflict (user_id, run_id) where run_id is not null do nothing returning id`,
    [userId, run.crew_id, runId, run.coins],
  );
  if (inserted.length > 0) await query("update users set coins = coins + $2 where id = $1", [userId, run.coins]);
}
