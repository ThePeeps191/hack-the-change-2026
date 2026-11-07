import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { currentRun } from "@/server/runs";

// The quest you're on right now, or null.
export const GET = authed(async (user) => ok(await currentRun(user)));
