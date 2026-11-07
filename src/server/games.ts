import "server-only";
import { Glicko2 } from "glicko2";
import type { Game, GameTeam, User, Zone } from "@/lib/contracts";
import { one, query, transaction } from "@/lib/db";
import { HttpError, notFound } from "@/lib/route";
import { CAMPUS_ZONES } from "./db/claim-zones";
import { getQuest } from "./quests";
import { advance, loadRun } from "./runs";

type GameRow = { id: string; name: string; status: Game["status"]; created_by: string; created_at: Date };

type ZoneRow = Omit<Zone, "my_run_id" | "my_run_ready" | "quest">;

// Your own team first: the Claim screen reads teams[0] as "us".
async function toGame(row: GameRow, user: User): Promise<Game> {
  const teams = await query<GameTeam>("select id, game_id, crew_id, name from game_teams where game_id = $1 order by id", [row.id]);
  const mine = await query<{ crew_id: string }>("select crew_id from crew_members where user_id = $1", [user.id]);
  const myCrews = new Set(mine.map((m) => m.crew_id));
  teams.sort((a, b) => Number(myCrews.has(b.crew_id)) - Number(myCrews.has(a.crew_id)));
  const myTeam = teams.find((t) => myCrews.has(t.crew_id));

  const zones = await query<ZoneRow>("select * from zones where game_id = $1 order by name", [row.id]);
  const open = myTeam
    ? await query<{ id: string; zone_id: string; approved: boolean }>(
        `select r.id, r.zone_id, exists (
           select 1 from submissions s where s.run_id = r.id and s.verdict = 'approved'
         ) as approved
         from quest_runs r
         where r.team_id = $1 and r.status <> 'expired'
           and not exists (select 1 from zone_attempts a where a.run_id = r.id)
         order by r.started_at`,
        [myTeam.id],
      )
    : [];
  const runByZone = new Map(open.map((r) => [r.zone_id, r]));

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at.toISOString(),
    teams,
    zones: await Promise.all(
      zones.map(async (z) => ({
        ...z,
        quest: await getQuest(z.quest_id),
        my_run_id: runByZone.get(z.id)?.id ?? null,
        my_run_ready: runByZone.get(z.id)?.approved ?? false,
      })),
    ),
  };
}

async function gameFor(user: User, id: string) {
  const row = await one<GameRow>(
    `select g.* from games g
     join game_teams t on t.game_id = g.id
     join crew_members m on m.crew_id = t.crew_id
     where g.id = $1 and m.user_id = $2 limit 1`,
    [id, user.id],
  );
  if (!row) throw notFound("game");
  return row;
}

export const getGame = async (user: User, id: string) => toGame(await gameFor(user, id), user);

export async function currentGame(user: User) {
  const row = await one<GameRow>(
    `select g.* from games g
     join game_teams t on t.game_id = g.id
     join crew_members m on m.crew_id = t.crew_id
     where m.user_id = $1 and g.status = 'active'
     order by g.created_at desc limit 1`,
    [user.id],
  );
  if (!row) throw new HttpError(404, "no game yet");
  return toGame(row, user);
}

// A new game on the campus board. Give a rival crew's invite code to play
// against them; without one, your crew plays for the map on its own.
export async function createGame(user: User, body: { crew_id?: string; name?: string; rival_code?: string }) {
  const crew = await one<{ id: string; name: string }>(
    `select c.id, c.name from crews c join crew_members m on m.crew_id = c.id
     where m.user_id = $1 and ($2::uuid is null or c.id = $2::uuid) order by m.joined_at limit 1`,
    [user.id, body.crew_id ?? null],
  );
  if (!crew) throw new HttpError(400, "start a crew first");
  const rival = body.rival_code
    ? await one<{ id: string; name: string }>("select id, name from crews where invite_code = $1", [body.rival_code.trim().toUpperCase()])
    : null;
  if (body.rival_code && !rival) throw new HttpError(404, "that code doesn't match a crew");
  if (rival?.id === crew.id) throw new HttpError(400, "that's your own crew. ask a rival crew for their code.");

  const row = await transaction(async () => {
    const game = await one<GameRow>("insert into games (name, created_by) values ($1, $2) returning *", [body.name?.trim().slice(0, 60) || "campus claim", user.id]);
    await query("insert into game_teams (game_id, crew_id, name) values ($1, $2, $3)", [game!.id, crew.id, crew.name]);
    if (rival) await query("insert into game_teams (game_id, crew_id, name) values ($1, $2, $3)", [game!.id, rival.id, rival.name]);
    for (const z of CAMPUS_ZONES) {
      await query(
        `insert into zones (game_id, name, lat, lng, radius_m, quest_id, result_unit, lower_is_better)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [game!.id, z.name, z.lat, z.lng, z.radius_m, z.quest_id, z.result_unit, z.lower_is_better],
      );
    }
    return game!;
  });
  return toGame(row, user);
}

// Claiming needs a run with approved proof. An empty zone goes to whoever
// finishes first; a held zone only moves if the new result beats the best one.
export async function attemptZone(user: User, gameId: string, zoneId: string, body: { run_id?: string; result?: number }) {
  await gameFor(user, gameId);
  if (!body.run_id || typeof body.result !== "number" || !Number.isFinite(body.result)) {
    throw new HttpError(400, "run_id and a result are required");
  }
  const run = await loadRun(body.run_id);
  if (!run || run.zone_id !== zoneId || !run.team_id) throw new HttpError(400, "that run isn't for this zone");
  const member = await one(
    `select 1 as yes from game_teams t join crew_members m on m.crew_id = t.crew_id where t.id = $1 and m.user_id = $2`,
    [run.team_id, user.id],
  );
  if (!member) throw new HttpError(403, "that's another team's run");
  await advance(run);
  const proof = await one("select 1 as yes from submissions where run_id = $1 and verdict = 'approved'", [run.id]);
  if (!proof) throw new HttpError(409, "finish the challenge and get your proof approved first");

  const teamId = run.team_id;
  const result = body.result;
  const runId = run.id;
  await transaction(async () => {
    const zone = await one<ZoneRow & { lower_is_better: boolean }>("select * from zones where id = $1 and game_id = $2 for update", [zoneId, gameId]);
    if (!zone) throw notFound("zone");
    const used = await one("select 1 as yes from zone_attempts where run_id = $1", [runId]);
    if (used) throw new HttpError(409, "that run has already been counted");
    const best = zone.best_result;
    const beats = best == null || (zone.lower_is_better ? result < best : result > best);
    await query("insert into zone_attempts (zone_id, team_id, run_id, result, won) values ($1, $2, $3, $4, $5)", [zoneId, teamId, runId, result, beats]);
    if (beats) {
      await query("update zones set held_by_team_id = $2, best_result = $3 where id = $1", [zoneId, teamId, result]);
      if (zone.held_by_team_id && zone.held_by_team_id !== teamId) await rateSteal(teamId, zone.held_by_team_id);
    }
  });
  const updated = (await toGame(await gameFor(user, gameId), user)).zones.find((z) => z.id === zoneId);
  return updated!;
}

// A stolen zone is the one real win and loss in the app, so it's the one place
// ratings move. Stranger quests are cooperative and never touch a rating.
async function rateSteal(winnerTeam: string, loserTeam: string) {
  type Rated = { id: string; rating: number; rating_rd: number; rating_vol: number };
  const crewOf = (team: string) =>
    one<Rated>("select c.id, c.rating, c.rating_rd, c.rating_vol from crews c join game_teams t on t.crew_id = c.id where t.id = $1", [team]);
  const [winner, loser] = await Promise.all([crewOf(winnerTeam), crewOf(loserTeam)]);
  if (!winner || !loser) return;
  const ranking = new Glicko2({ tau: 0.5, rating: 1500, rd: 350, vol: 0.06 });
  const w = ranking.makePlayer(winner.rating, winner.rating_rd, winner.rating_vol);
  const l = ranking.makePlayer(loser.rating, loser.rating_rd, loser.rating_vol);
  ranking.updateRatings([[w, l, 1]]);
  for (const [crew, player] of [[winner, w], [loser, l]] as const) {
    await query("update crews set rating = $2, rating_rd = $3, rating_vol = $4 where id = $1", [crew.id, player.getRating(), player.getRd(), player.getVol()]);
  }
}
