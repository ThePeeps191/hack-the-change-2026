import { databaseKind } from "@/lib/db";
import { AUTH_MODE, DEMO_MODE, GEMINI_MODE } from "@/lib/env";
import { ok } from "@/lib/http";
import { safe } from "@/lib/route";

export const GET = safe(async () =>
  ok({ ok: true, auth_mode: AUTH_MODE, gemini_mode: GEMINI_MODE, demo_mode: DEMO_MODE, database: await databaseKind() }),
);
