import { ok } from "@/lib/http";
import { safe } from "@/lib/route";
import { inviteDetails } from "@/server/matching";

// Public: no login needed, so the invite screen can show the quest before the
// recipient signs in.
export const GET = safe<RouteContext<"/api/invites/[code]">>(async (_req, ctx) => {
  const { code } = await ctx.params;
  return ok(await inviteDetails(code));
});
