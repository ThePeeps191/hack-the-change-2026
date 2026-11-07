import "server-only";
import type { Dashboard } from "@/lib/contracts";
import { starterQuests } from "@/lib/starter-quests";

export function mockDashboard(): Dashboard {
  const q = starterQuests();
  const partners = ["Priya", "Theo", "Mina", null];
  return {
    quests_done: 12,
    km_moved: 9.4,
    people_met: 7,
    coins: 240,
    minutes_outside: 214,
    streak_days: 3,
    rating: 1520,
    history: q.slice(0, 5).map((quest, i) => ({
      run_id: `r0000000-0000-4000-8000-00000000000${i + 1}`,
      quest,
      completed_at: new Date(Date.UTC(2026, 10, 6 - i, 19, 30)).toISOString(),
      coins: quest.coins,
      partner: partners[i % partners.length] ? { display_name: partners[i % partners.length]!, avatar_url: null } : null,
      distance_m: 400 + i * 180,
    })),
  };
}
