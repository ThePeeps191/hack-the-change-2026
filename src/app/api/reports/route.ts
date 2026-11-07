import { body, noContent } from "@/lib/http";
import { authed } from "@/lib/route";
import { report } from "@/server/people";

export const POST = authed(async (user, req) => {
  await report(user, await body<{ reported_id: string; run_id: string; reason: string }>(req));
  return noContent();
});
