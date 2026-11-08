import type { Zone } from "@/lib/contracts";

// A zone whose challenge can be done anywhere on campus (its quest's type is
// "anywhere", set in data/claim-quests.json). It has no place of its own, so the
// maps leave it out and the zone list puts it last.
export const isAnywhere = (z: Zone) => z.quest?.type === "anywhere";
