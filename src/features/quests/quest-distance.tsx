"use client";
import { useEffect, useState } from "react";
import { SHOW_QUEST_DISTANCE } from "@/lib/config";
import type { Quest } from "@/lib/contracts";
import { distance } from "@/lib/format";
import { getPosition, metresBetween } from "@/lib/geo";

type Spot = { lat: number; lng: number };

// One location lookup shared by every quest on screen, refreshed at most once a
// minute. Only if location is already allowed: this never pops a prompt, and
// with GPS denied or unknown it gives null, so nothing is shown.
let cached: { at: number; spot: Promise<Spot | null> } | null = null;
function whereYouAre(): Promise<Spot | null> {
  if (cached && Date.now() - cached.at < 60_000) return cached.spot;
  const spot = (async () => {
    const permission = await navigator.permissions?.query({ name: "geolocation" });
    if (permission?.state !== "granted") return null;
    const pos = await getPosition();
    return pos.approximate ? null : { lat: pos.lat, lng: pos.lng };
  })().catch(() => null);
  cached = { at: Date.now(), spot };
  return spot;
}

// "350 m away" for a quest with a place, or nothing at all: when the feature is
// off, the quest has no place, or we don't know where you are.
export function QuestDistance({ quest, prefix = " · " }: { quest: Quest; prefix?: string }) {
  const [here, setHere] = useState<Spot | null>(null);
  const placed = quest.lat != null && quest.lng != null;

  useEffect(() => {
    if (!SHOW_QUEST_DISTANCE || !placed) return;
    let alive = true;
    whereYouAre().then((spot) => { if (alive) setHere(spot); });
    return () => { alive = false; };
  }, [placed]);

  if (!SHOW_QUEST_DISTANCE || !placed || !here) return null;
  return <span className="whitespace-nowrap">{prefix}{distance(metresBetween(here, { lat: quest.lat!, lng: quest.lng! }))} away</span>;
}
