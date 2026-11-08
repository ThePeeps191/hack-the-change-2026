import { databaseKind } from "@/lib/db";
import { AI_MODE, AI_PROVIDER, AUTH_MODE, DEMO_MODE } from "@/lib/env";
import { ok } from "@/lib/http";
import { secret } from "@/lib/secrets";
import { safe } from "@/lib/route";
import { hasTimescale } from "@/server/week";

export const GET = safe(async () =>
  ok({ ok: true, auth_mode: AUTH_MODE, ai_mode: AI_MODE, ai_provider: AI_PROVIDER,
    // Where each key came from ("env-file", "shell" or null). Never the key itself.
    ai_keys: { anthropic: secret("ANTHROPIC_API_KEY").source, gemini: secret("GEMINI_API_KEY").source },
    demo_mode: DEMO_MODE, database: await databaseKind(),
    // True on Tiger Data, where the You tab's week uses TimescaleDB's time_bucket.
    timescaledb: await hasTimescale() }),
);
