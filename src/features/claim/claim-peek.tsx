"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { inkFlagMarkup } from "@/components/ui/ink";
import type { Game } from "@/lib/contracts";

// A tiny trail map of the live Claim game for the card on the Crew page.
// Each zone is a flag placed where it really is on campus (its lat/lng scaled
// into the box, north up). The zones are joined by a dotted walking loop
// (sorted by angle round their middle, then drawn as a smooth closed curve),
// sitting on a faint patch of ground, so the flags read as stops on a walk.
// White and flying for your crew, warm orange for the rivals, an empty outline
// while open. With no game it draws nothing.
const W = 132;
const H = 104;
const PAD = 18;

type Pt = { x: number; y: number };

// A smooth closed curve through the points (Catmull-Rom turned into Béziers).
function loop(p: Pt[]) {
  const n = p.length;
  const at = (i: number) => p[(i + n) % n];
  let d = `M${at(0).x} ${at(0).y}`;
  for (let i = 0; i < n; i++) {
    const [a, b, c, e] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 };
    const c2 = { x: c.x - (e.x - b.x) / 6, y: c.y - (e.y - b.y) / 6 };
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${c.x} ${c.y}`;
  }
  return `${d} Z`;
}

export function ClaimPeek({ crewId }: { crewId?: string }) {
  const [game, setGame] = useState<Game | null>(null);
  useEffect(() => {
    api.game("current").then(setGame).catch(() => {});
  }, []);
  if (!game || game.zones.length < 2) return null;

  const us = game.teams.find((t) => t.crew_id === crewId) ?? game.teams[0];
  const lats = game.zones.map((z) => z.lat);
  const lngs = game.zones.map((z) => z.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const pts = game.zones.map((z) => ({
    z,
    x: Math.round(PAD + ((z.lng - minLng) / (maxLng - minLng || 1)) * (W - PAD * 2)),
    y: Math.round(PAD + 6 + ((maxLat - z.lat) / (maxLat - minLat || 1)) * (H - PAD * 2 - 6)),
  }));
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const ring = [...pts].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  const path = loop(ring);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="shrink-0 overflow-visible" aria-hidden>
      {/* the ground: the same loop, filled and drawn very wide, so it becomes a soft patch */}
      {/* (group opacity, so where fill and stroke overlap it doesn't get lighter) */}
      <g opacity=".09">
        <path d={path} fill="#fff" stroke="#fff" strokeWidth="30" strokeLinejoin="round" />
      </g>
      {/* the walking loop between zones */}
      <path d={path} fill="none" stroke="rgb(255 255 255 / .55)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.1 5" />
      {pts.map(({ z, x, y }) => {
        const held = z.held_by_team_id != null;
        const ours = held && z.held_by_team_id === us?.id;
        const color = ours ? "#ffffff" : held ? "#ffb48a" : "rgb(255 255 255 / .7)";
        return (
          <g key={z.id} transform={`translate(${x - 5} ${y - 17}) scale(.8)`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <ellipse cx="6.3" cy="21.3" rx="5" ry="1.6" fill="rgb(10 20 50 / .3)" stroke="none" />
            <g dangerouslySetInnerHTML={{ __html: inkFlagMarkup(held, color) }} />
          </g>
        );
      })}
    </svg>
  );
}
