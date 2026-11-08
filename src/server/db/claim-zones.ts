// The Claim board for UCalgary main campus. Each spot (zone) and its challenge
// live together in data/claim-quests.json: the quest fields are the challenge,
// and `zone` is the spot's name, place on the map and how its score works.
// Edit them on a map with `bun tools/quest-maker-server.ts`, then open /claim.
// The quests are synced into the quests table but kept out of quest lists.
import claimQuests from "../../../data/claim-quests.json";

export type ZoneTemplate = {
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  quest_id: string;
  result_unit: string;
  lower_is_better: boolean;
};

export const CAMPUS_ZONES: ZoneTemplate[] = claimQuests.map((q) => ({ ...q.zone, quest_id: q.id }));
