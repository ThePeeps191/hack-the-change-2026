import { after } from "next/server";
import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { prewriteRecap } from "@/server/recaps";
import { getRun } from "@/server/runs";

// The recap's words can take a few seconds to write, so once the quest is done
// they're written after this reply, while you're still on the quest screen.
export const maxDuration = 60;

export const GET = authed<RouteContext<"/api/runs/[id]">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  const run = await getRun(user, id);
  if (run.status === "completed") after(() => prewriteRecap(user, id));
  return ok(run);
});
