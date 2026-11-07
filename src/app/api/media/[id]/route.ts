import { AUTH_MODE } from "@/lib/env";
import { one } from "@/lib/db";
import { fail } from "@/lib/http";
import { authed } from "@/lib/route";
import { readUpload } from "@/lib/uploads";

// Proof media is only served to people on that quest. Mock login skips the check
// because an <img> can't send the per-tab identity header.
export const GET = authed<RouteContext<"/api/media/[id]">>(async (user, _req, ctx) => {
  const { id } = await ctx.params;
  const row = await one<{ media_path: string | null; media_type: string | null; run_id: string }>(
    "select media_path, media_type, run_id from submissions where id = $1",
    [id],
  );
  if (!row?.media_path) return fail("not found", 404);
  if (AUTH_MODE !== "mock") {
    const member = await one("select 1 as yes from run_members where run_id = $1 and user_id = $2", [row.run_id, user.id]);
    if (!member) return fail("not found", 404);
  }
  const file = await readUpload(row.media_path).catch(() => null);
  if (!file) return fail("not found", 404);
  return new Response(new Uint8Array(file), {
    headers: { "content-type": row.media_type ?? "application/octet-stream", "cache-control": "private, max-age=3600" },
  });
});
