import { body, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { joinCrew } from "@/server/crews";

export const POST = authed(async (user, req) => {
  const { invite_code } = await body<{ invite_code: string }>(req);
  return ok(await joinCrew(user, invite_code));
});
