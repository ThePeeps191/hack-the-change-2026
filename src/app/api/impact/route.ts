import { ok } from "@/lib/http";
import { safe } from "@/lib/route";
import { getImpact } from "@/server/impact";

// Public, no login: community totals only, never names or places.
export const GET = safe(async () => ok(await getImpact()));
