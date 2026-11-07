import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { currentMatch } from "@/server/matching";

// Polled by the client. null means still searching (or not free).
export const GET = authed(async (user) => ok(await currentMatch(user)));
