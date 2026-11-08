import { body, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { crewNameForCode, joinCrew } from "@/server/crews";

export const GET = authed(async (_user, req) => ok(await crewNameForCode(new URL(req.url).searchParams.get("code"))));

export const POST = authed(async (user, req) => {
  const { invite_code } = await body<{ invite_code: string }>(req);
  return ok(await joinCrew(user, invite_code));
});
