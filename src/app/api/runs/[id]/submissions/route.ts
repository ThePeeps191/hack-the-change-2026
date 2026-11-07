// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { judgeProof } from "@/lib/gemini";
import { fail, ok } from "@/lib/http";
import type { Verdict } from "@/lib/contracts";
import { getRun, submit } from "@/mocks/store";

// Multipart: media, lat, lng, taken_at. Returns a pending verdict straight
// away; poll GET /api/runs/:id for the final one. In mock mode, send
// mock_verdict=rejected to see the rejection state.
export async function POST(req: Request, ctx: RouteContext<"/api/runs/[id]/submissions">) {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run) return fail("run not found", 404);
  const form = await req.formData().catch(() => null);
  const media = form?.get("media");
  const num = (k: string) => (form?.get(k) ? Number(form.get(k)) : null);
  let verdict: Verdict = await judgeProof({
    quest: run.quest,
    media_type: media instanceof File ? media.type : "unknown",
    lat: num("lat"),
    lng: num("lng"),
    taken_at: (form?.get("taken_at") as string) ?? null,
  });
  if (form?.get("mock_verdict") === "rejected") {
    verdict = {
      status: "rejected",
      reason: "we can see a bookshelf, but not a title page. get a little closer to the first pages and try again?",
    };
  }
  return ok(submit(id, verdict));
}
