import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { crewLeaderboard, memberLeaderboard } from "@/server/crews";

// ?crew_id= ranks that crew's members, otherwise all crews.
export const GET = authed(async (user, req) => {
  const crewId = new URL(req.url).searchParams.get("crew_id");
  return ok(crewId ? await memberLeaderboard(user, crewId) : await crewLeaderboard(user));
});
