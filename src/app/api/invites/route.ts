import { ok } from "@/lib/http";
import { authed, publicOrigin } from "@/lib/route";
import { createInvite } from "@/server/matching";

export const POST = authed(async (user, req) => ok(await createInvite(user, publicOrigin(req))));
