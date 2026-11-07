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
    active_minutes_week: 86,
    active_goal_minutes: 150,
    familiar_faces: [
      { display_name: "Priya", avatar_url: null, quests_together: 3, minutes_together: 58, last_seen: "2026-11-06T19:30:00Z" },
      { display_name: "Theo", avatar_url: null, quests_together: 2, minutes_together: 37, last_seen: "2026-11-05T18:10:00Z" },
    ],
    new_places: [
      { name: "Taylor Family Digital Library, 4th floor", lat: 51.0777, lng: -114.1293, first_visit: "2026-11-06T19:10:00Z" },
      { name: "Rozsa Centre", lat: 51.0749, lng: -114.1297, first_visit: "2026-11-02T17:40:00Z" },
      { name: "Olympic Oval", lat: 51.0766, lng: -114.1357, first_visit: "2026-11-03T20:05:00Z" },
    ],
    mood: { after_better: 8, checkins: 10 },
  };
}
