import { body, fail, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { listConnections, stayInTouch } from "@/server/people";

// People I've connected with.
export const GET = authed(async (user) => ok(await listConnections(user)));

// Opt in to stay in touch. Connected only when both people opt in.
export const POST = authed(async (user, req) => {
  const { run_id } = await body<{ run_id: string }>(req);
  if (!run_id) return fail("run_id is required");
  return ok(await stayInTouch(user, run_id));
});
