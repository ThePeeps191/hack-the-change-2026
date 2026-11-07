import { ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { getDashboard } from "@/server/dashboard";

export const GET = authed(async (user) => ok(await getDashboard(user)));
