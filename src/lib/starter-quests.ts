import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Quest } from "./contracts";

// Hand-tuned quests, one JSON file per place in data/quests/. Drop in a new
// file to add a place; nothing else needs to change. Also the fallback when
// Gemini is slow or down.
let cache: Quest[] | null = null;

export function starterQuests(): Quest[] {
  if (cache) return cache;
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
