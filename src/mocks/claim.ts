import type { Game } from "@/lib/contracts";

// A Claim game across UCalgary main campus. Coordinates are approximate.
const game_id = "g0000000-0000-4000-8000-000000000001";
const us = "t0000000-0000-4000-8000-000000000001";
const them = "t0000000-0000-4000-8000-000000000002";

export const mockGame: Game = {
  id: game_id,
  name: "saturday on campus",
  status: "active",
  created_by: "00000000-0000-4000-8000-000000000001",
  created_at: "2026-11-07T18:00:00Z",
  teams: [
    { id: us, game_id, crew_id: "c0000000-0000-4000-8000-000000000001", name: "the long way round" },
    { id: them, game_id, crew_id: "c0000000-0000-4000-8000-000000000002", name: "north campus walkers" },
  ],
  zones: [
    { id: "z1", game_id, name: "TFDL", lat: 51.0777, lng: -114.1293, radius_m: 80, quest_id: "a1b2c3d4-0001-4000-8000-000000000001", held_by_team_id: us, best_result: 1891, result_unit: "year" },
    { id: "z2", game_id, name: "Mac Hall", lat: 51.0786, lng: -114.1306, radius_m: 70, quest_id: "a1b2c3d4-0002-4000-8000-000000000001", held_by_team_id: them, best_result: 4, result_unit: "snacks" },
    { id: "z3", game_id, name: "Olympic Oval", lat: 51.0766, lng: -114.1357, radius_m: 120, quest_id: "a1b2c3d4-0003-4000-8000-000000000001", held_by_team_id: null, best_result: null, result_unit: "seconds" },
    { id: "z4", game_id, name: "Rozsa Centre", lat: 51.0749, lng: -114.1297, radius_m: 80, quest_id: "a1b2c3d4-0004-4000-8000-000000000001", held_by_team_id: them, best_result: 3, result_unit: "posters" },
    { id: "z5", game_id, name: "Social Sciences", lat: 51.0794, lng: -114.131, radius_m: 90, quest_id: "a1b2c3d4-0099-4000-8000-000000000002", held_by_team_id: null, best_result: null, result_unit: "seconds" },
  ],
};
