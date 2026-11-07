"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Game } from "@/lib/contracts";

// A tiny trail map of the live Claim game for the card on the Crew page. Each
// zone is a little flag placed where it really is on campus (its lat/lng
// scaled into the box): filled white and flying for your crew, warm orange for
// the rivals, an empty outline while it's open. With no game it draws nothing.
export function ClaimPeek({ crewId }: { crewId?: string }) {
  const [game, setGame] = useState<Game | null>(null);
  useEffect(() => {
    api.game("current").then(setGame).catch(() => {});
  }, []);
  if (!game || game.zones.length === 0) return null;

  const us = game.teams.find((t) => t.crew_id === crewId) ?? game.teams[0];
  const lats = game.zones.map((z) => z.lat);
  const lngs = game.zones.map((z) => z.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const W = 124;
  const H = 50;
  const pad = 10;
  // North is up, so a bigger latitude sits higher in the box.
  const x = (lng: number) => pad + ((lng - minLng) / (maxLng - minLng || 1)) * (W - pad * 2);
  const y = (lat: number) => pad + ((maxLat - lat) / (maxLat - minLat || 1)) * (H - pad * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="absolute right-5 bottom-3 overflow-visible" aria-hidden>
      {game.zones.map((z) => {
        const held = z.held_by_team_id != null;
        const ours = held && z.held_by_team_id === us?.id;
        const color = ours ? "#ffffff" : held ? "#ffb48a" : "rgb(255 255 255 / .6)";
        const px = Math.round(x(z.lng));
        const py = Math.round(y(z.lat));
        return (
          <g key={z.id} transform={`translate(${px - 6} ${py - 14})`} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <ellipse cx="6" cy="14.5" rx="3.5" ry="1.1" fill="rgb(0 0 0 / .18)" stroke="none" />
            <path d="M6 14V2" />
            <path d="M6 2h7l-1.6 2.6L13 7H6" fill={held ? color : "none"} fillOpacity={held ? 0.9 : 0} className={held ? "flag-fly" : ""} style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }} />
          </g>
        );
      })}
    </svg>
  );
}
