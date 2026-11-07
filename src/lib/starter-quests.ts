import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Quest } from "./contracts";

// Hand-tuned quests, all in data/quests/quests.json (any other .json file in
// that folder is read too). Also the fallback when Gemini is slow or down.
let cache: Quest[] | null = null;

export function starterQuests(): Quest[] {
  // Re-read in dev so edits from tools/quest-maker-server.ts show up without a restart.
  if (cache && process.env.NODE_ENV === "production") return cache;
  const dir = path.join(process.cwd(), "data", "quests");
  cache = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as Quest[]);
  return cache;
}

export function findStarterQuest(id: string): Quest | undefined {
  return starterQuests().find((q) => q.id === id);
}
