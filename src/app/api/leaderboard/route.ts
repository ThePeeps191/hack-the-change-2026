// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { ok } from "@/lib/http";
import { mockCrew, mockLeaderboard } from "@/mocks/crews";

// ?crew_id= ranks that crew's members, otherwise all crews.
export async function GET(req: Request) {
  const crewId = new URL(req.url).searchParams.get("crew_id");
  if (!crewId) return ok(mockLeaderboard);
  const members = [...mockCrew.members].sort((a, b) => b.coins - a.coins);
  return ok(members.map((m, i) => ({ rank: i + 1, id: m.user_id, name: m.display_name, coins: m.coins })));
}
