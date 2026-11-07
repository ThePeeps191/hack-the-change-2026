// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";

export async function POST(req: Request) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  return ok({ code, url: new URL(`/invite/${code}`, req.url).toString() });
}
