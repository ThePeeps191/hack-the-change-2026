import { body, fail, noContent } from "@/lib/http";
import { authed } from "@/lib/route";
import { recordPings } from "@/server/runs";

export const POST = authed(async (user, req) => {
  const { run_id, points } = await body<{ run_id: string; points: { lat: number; lng: number; at: string }[] }>(req);
  if (!run_id || !Array.isArray(points)) return fail("run_id and points are required");
  await recordPings(user, run_id, points);
  return noContent();
});
