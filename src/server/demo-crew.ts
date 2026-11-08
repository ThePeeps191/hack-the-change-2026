import "server-only";
import { one, query, transaction } from "@/lib/db";
import { CAMPUS_ZONES } from "./db/claim-zones";
import { DEMO_CREW_ID, DEMO_GAME_ID, DEMO_RIVAL_ID, SEED_HOLDERS } from "./db/setup";
import { freshCode } from "./crews";

// Copies a seeded crew for one "Try the demo" visitor: same name, rating and
// made-up members, a fresh invite code. The visitor "created" it, which is how
// the weekly board knows to show it only to them.
async function copyCrew(seedId: string, userId: string) {
  const crew = await one<{ id: string; name: string }>(
    `insert into crews (name, invite_code, created_by, rating, avatar)
     select name, $2, $3, rating, avatar from crews where id = $1 returning id, name`,
    [seedId, await freshCode(), userId],
  );
  await query(
    `insert into crew_members (crew_id, user_id)
     select $2, m.user_id from crew_members m join users u on u.id = m.user_id
     where m.crew_id = $1 and u.auth0_sub like 'seed|%'`,
    [seedId, crew!.id],
  );
  return crew!;
}

// Each judge gets their own copy of the demo crew and its Claim game, so one
// judge's steals and joins never show up for the next one. A fresh "Try the
// demo" login is also how a presenter resets the board between rounds. Does
// nothing if the seed data isn't there, or if this person already has a crew.
export async function giveDemoCrew(userId: string) {
  const seeded = await one("select 1 as yes from crews where id = $1", [DEMO_CREW_ID]);
  const busy = await one("select 1 as yes from crew_members where user_id = $1", [userId]);
  if (!seeded || busy) return;
  await transaction(async () => {
    const us = await copyCrew(DEMO_CREW_ID, userId);
    await query("insert into crew_members (crew_id, user_id) values ($1, $2)", [us.id, userId]);
    await query(
      "insert into crew_quests (crew_id, quest_id, shared_by) select $2, quest_id, shared_by from crew_quests where crew_id = $1",
      [DEMO_CREW_ID, us.id],
    );
    const them = await copyCrew(DEMO_RIVAL_ID, userId);

    const game = await one<{ id: string }>("insert into games (name, created_by) select name, $2 from games where id = $1 returning id", [DEMO_GAME_ID, userId]);
    const team = async (crew: { id: string; name: string }) =>
      (await one<{ id: string }>("insert into game_teams (game_id, crew_id, name) values ($1, $2, $3) returning id", [game!.id, crew.id, crew.name]))!.id;
    const teams = { us: await team(us), them: await team(them) };
    for (const [i, z] of CAMPUS_ZONES.entries()) {
      const [holder, best] = SEED_HOLDERS[i] ?? [null, null];
      await query(
        `insert into zones (game_id, name, lat, lng, radius_m, quest_id, held_by_team_id, best_result, result_unit, lower_is_better)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [game!.id, z.name, z.lat, z.lng, z.radius_m, z.quest_id, holder && teams[holder], best, z.result_unit, z.lower_is_better],
      );
    }
  });
}
