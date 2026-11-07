import { after } from "next/server";
import { fail, ok } from "@/lib/http";
import { authed } from "@/lib/route";
import { judgeSubmission, submitProof } from "@/server/proof";

// Multipart: media, lat, lng, taken_at. Returns a pending verdict straight away
// and judges the proof after responding; poll GET /api/runs/:id for the result.
// With GEMINI_MODE=mock, send mock_verdict=rejected to see the rejection state.
export const POST = authed<RouteContext<"/api/runs/[id]/submissions">>(async (user, req, ctx) => {
  const { id } = await ctx.params;
  const form = await req.formData().catch(() => null);
  if (!form) return fail("send this as multipart form data");
  const { verdict, submissionId } = await submitProof(user, id, form);
  if (submissionId) after(() => judgeSubmission(submissionId));
  return ok(verdict);
});
