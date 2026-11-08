import { body, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { startRun } from "@/server/runs";

// Crew and solo runs only. Pair runs are created by the server and arrive on Match.run_id.
export const POST = authed(async (user, req) => {
  return ok(await startRun(user, await body<{ quest_id: string; crew_id: string }>(req)));
});
