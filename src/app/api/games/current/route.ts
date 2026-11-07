import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { currentGame } from "@/server/games";

// Your crew's active Claim game, or a 404 if there isn't one.
export const GET = authed(async (user) => ok(await currentGame(user)));
