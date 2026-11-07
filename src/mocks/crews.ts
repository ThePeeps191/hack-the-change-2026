import type { Crew, LeaderboardEntry } from "@/lib/contracts";
import { mockUser } from "./user";

const at = "2026-11-03T18:00:00Z";

export const mockCrew: Crew = {
  id: "c0000000-0000-4000-8000-000000000001",
  name: "the long way round",
  invite_code: "MAPLE-42",
  created_by: mockUser.id,
  created_at: at,
  coins: 1180,
  rating: 1542,
  members: [
    { user_id: mockUser.id, display_name: "Sam", avatar_url: null, coins: 240, joined_at: at },
    { user_id: "00000000-0000-4000-8000-000000000003", display_name: "Theo", avatar_url: null, coins: 410, joined_at: at },
    { user_id: "00000000-0000-4000-8000-000000000004", display_name: "Mina", avatar_url: null, coins: 330, joined_at: at },
    { user_id: "00000000-0000-4000-8000-000000000005", display_name: "Jo", avatar_url: null, coins: 200, joined_at: at },
  ],
  shared_quests: [],
};

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, id: "c0000000-0000-4000-8000-000000000002", name: "north campus walkers", coins: 1420, rating: 1610 },
  { rank: 2, id: mockCrew.id, name: mockCrew.name, coins: 1180, rating: 1542, delta: 30 },
  { rank: 3, id: "c0000000-0000-4000-8000-000000000003", name: "oval regulars", coins: 960, rating: 1498 },
  { rank: 4, id: "c0000000-0000-4000-8000-000000000004", name: "the 4th floor", coins: 720, rating: 1455 },
  { rank: 5, id: "c0000000-0000-4000-8000-000000000005", name: "snack scouts", coins: 510, rating: 1402 },
];
