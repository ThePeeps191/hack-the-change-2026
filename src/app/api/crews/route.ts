// Mock stub. Real implementation replaces the body; keep the response shape from docs/CONTRACTS.md.
import { body, ok } from "@/lib/http";
import { mockCrew } from "@/mocks/crews";

export async function POST(req: Request) {
  const { name } = await body<{ name: string }>(req);
  return ok({ ...mockCrew, id: crypto.randomUUID(), name: name ?? "new crew", members: mockCrew.members.slice(0, 1), coins: 0 });
}
