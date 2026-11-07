// The Claim board for UCalgary main campus. Coordinates are approximate.
// Every zone points at a quest in data/quests/.
export type ZoneTemplate = {
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  quest_id: string;
  result_unit: string;
  lower_is_better: boolean;
};

export const CAMPUS_ZONES: ZoneTemplate[] = [
  { name: "TFDL", lat: 51.0777, lng: -114.1293, radius_m: 80, quest_id: "a1b2c3d4-0001-4000-8000-000000000001", result_unit: "year", lower_is_better: true },
  { name: "Mac Hall", lat: 51.0786, lng: -114.1306, radius_m: 70, quest_id: "a1b2c3d4-0002-4000-8000-000000000001", result_unit: "snacks", lower_is_better: false },
  { name: "Olympic Oval", lat: 51.0766, lng: -114.1357, radius_m: 120, quest_id: "a1b2c3d4-0003-4000-8000-000000000001", result_unit: "seconds", lower_is_better: true },
  { name: "Rozsa Centre", lat: 51.0749, lng: -114.1297, radius_m: 80, quest_id: "a1b2c3d4-0004-4000-8000-000000000001", result_unit: "posters", lower_is_better: false },
  { name: "Kinesiology", lat: 51.0771, lng: -114.1332, radius_m: 90, quest_id: "a1b2c3d4-0099-4000-8000-000000000002", result_unit: "seconds", lower_is_better: false },
];
