import { body, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { createGame } from "@/server/games";

export const POST = authed(async (user, req) => {
  return ok(await createGame(user, await body<{ crew_id: string; name: string; rival_code: string }>(req)));
});
