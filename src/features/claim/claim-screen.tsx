"use client";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Zone } from "@/lib/contracts";
import { usePoll } from "@/lib/use-poll";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Skeleton } from "@/components/ui/card";
import type { GlobeMarker } from "@/components/map/globe-map";
import { NoGame, ZoneActions } from "./claim-actions";

const GlobeMap = dynamic(() => import("@/components/map/globe-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse" style={{ background: "linear-gradient(180deg, var(--color-sky-top), var(--color-sky-bottom))" }} />,
});

// TODO(backend): there's no "my active game" endpoint yet, so this asks for
// "current" and the mock returns the demo game.
const GAME_ID = "current";

const colors = { free: "#9aa09a", ours: "var(--color-accent)", theirs: "var(--color-anywhere)" };
// Each zone is a flag on the map: blue for your crew, orange for the rival
// crew, plain white while nobody holds it. The words beside it say the same
// thing, so colour is never the only clue.
const hues = { ours: 222, theirs: 22, free: undefined } as const;
//
// A held zone's flag is filled and flies (the cloth sways from the pole,
// .flag-fly in globals.css); an open zone's flag is a still, empty outline.
const POLE = "M6 21V4";
const FLYING = "M6 4h11l-2.5 4L17 12H6";
const flagPaths = (held: boolean) => `<path d="${POLE}"/><path class="${held ? "flag-fly" : ""}" d="${FLYING}"/>`;
const flagSvg = (held: boolean) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${flagPaths(held)}</svg>`;

function Flag({ held, color, size }: { held: boolean; color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d={POLE} />
      <path d={FLYING} fill={held ? color : "none"} fillOpacity=".22" className={held ? "flag-fly" : ""} />
    </svg>
  );
}

// "4 snacks", "1923", "38 seconds": a zone's best result in plain words.
function best(z: Zone) {
  if (z.best_result == null) return null;
  if (z.result_unit === "year") return `from ${z.best_result}`;
  return `${z.best_result} ${z.result_unit ?? ""}`.trim();
}

export function ClaimScreen() {
  const [started, setStarted] = useState(0);
  const { data: game, error } = usePoll(() => api.game(GAME_ID), { ms: 5000, key: started });
  const [picked, setPicked] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const us = game?.teams[0];
  const them = game?.teams[1];

  const tone = (z: Zone) => (z.held_by_team_id == null ? "free" : z.held_by_team_id === us?.id ? "ours" : "theirs");
  const markers = useMemo<GlobeMarker[]>(
    () => (game?.zones ?? []).map((z) => ({ id: z.id, lat: z.lat, lng: z.lng, label: z.name, color: colors[tone(z)], icon: flagSvg(tone(z) !== "free"), hue: hues[tone(z)] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tone depends only on game
    [game],
  );
  const zone = game?.zones.find((z) => z.id === picked) ?? null;
  const held = { ours: 0, theirs: 0, free: 0 };
  for (const z of game?.zones ?? []) held[tone(z)]++;

  function choose(id: string) {
    const z = game?.zones.find((x) => x.id === id);
    setPicked(id);
    if (z) setFocus({ lat: z.lat, lng: z.lng });
  }

  return (
    <AppShell>
      <motion.div
        className="relative overflow-hidden rounded-b-[36px] shadow-card"
        initial={false}
        animate={{ height: zone ? "46dvh" : "60dvh" }}
        transition={{ type: "spring", stiffness: 260, damping: 34 }}
      >
        <GlobeMap markers={markers} selected={picked} onSelect={choose} focus={focus} intro={false} fit />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-[max(8px,env(safe-area-inset-top))]">
          <Link href="/crew" aria-label="Back to crew" className="pointer-events-auto grid size-11 place-items-center rounded-full bg-surface/85 text-ink shadow-card backdrop-blur-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.5 5.5L8 12l6.5 6.5" />
            </svg>
          </Link>
          {game && (
            <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-surface/85 px-4 py-2 text-[13px] font-semibold text-ink shadow-card backdrop-blur-md" aria-label={`You hold ${held.ours}, they hold ${held.theirs}, ${held.free} open`}>
              <span className="text-accent"><span className="tabular-nums">{held.ours}</span> yours</span>
              <span className="text-rival"><span className="tabular-nums">{held.theirs}</span> theirs</span>
              <span className="text-ink-muted"><span className="tabular-nums">{held.free}</span> open</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="space-y-4 px-4 pt-5">
        {!game && error ? (
          <NoGame onStarted={() => setStarted((n) => n + 1)} />
        ) : !game ? (
          <Skeleton className="h-28 rounded-[24px]" />
        ) : (
          <>
            <div className="px-1">
              <Hand as="h1" className="text-[34px] leading-none font-bold">{game.name.toLowerCase()}</Hand>
              <p className="mt-1.5 text-[15px] text-ink-muted">
                <span className="font-semibold text-accent">{us?.name}</span>
                {them && <> vs <span className="font-semibold text-rival">{them.name}</span></>}. Beat a zone&apos;s best to take it.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {zone ? (
                <motion.div
                  key={zone.id}
                  className="rounded-[24px] bg-surface p-5 shadow-card"
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
                    <Flag held={tone(zone) !== "free"} color={colors[tone(zone)]} size={15} />
                    {tone(zone) === "ours" ? `Held by ${us?.name}` : tone(zone) === "theirs" ? `Held by ${them?.name}` : "Nobody holds this yet"}
                  </div>
                  <p className="mt-2 text-[22px] leading-tight font-semibold tracking-[-0.01em]">{zone.name}</p>
                  {zone.quest && (
                    <>
                      <p className="mt-1 text-[16px] font-medium">{zone.quest.title.charAt(0).toUpperCase() + zone.quest.title.slice(1)}</p>
                      <p className="mt-1 text-[15px] leading-snug text-ink-muted">{zone.quest.description}</p>
                    </>
                  )}
                  <div className="mt-4 flex items-baseline gap-2 border-t border-[var(--hairline)] pt-3">
                    {zone.best_result != null ? (
                      <>
                        <span className="font-[family-name:var(--font-display)] text-[30px] leading-none font-semibold tabular-nums">{zone.best_result}</span>
                        <span className="text-[14px] text-ink-muted">{zone.result_unit ?? ""} to beat</span>
                      </>
                    ) : (
                      <span className="text-[15px] text-ink-muted">Finish the challenge to take it.</span>
                    )}
                  </div>
                  <ZoneActions game={game} zone={zone} />
                </motion.div>
              ) : (
                <motion.ul key="list" className="rows overflow-hidden rounded-[24px] bg-surface shadow-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {game.zones.map((z) => (
                    <li key={z.id}>
                      <button onClick={() => choose(z.id)} className="flex min-h-16 w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-sunken/60">
                        <Flag held={tone(z) !== "free"} color={colors[tone(z)]} size={22} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[16px] font-semibold">{z.name}</span>
                          <span className="mt-0.5 block truncate text-[13px] text-ink-muted">
                            {z.quest ? z.quest.title.charAt(0).toUpperCase() + z.quest.title.slice(1) : "Challenge"}
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-[13px] leading-tight">
                          <span className={`block font-semibold ${tone(z) === "ours" ? "text-accent" : tone(z) === "theirs" ? "text-rival" : "text-ink-muted"}`}>
                            {tone(z) === "ours" ? "Yours" : tone(z) === "theirs" ? "Theirs" : "Open"}
                          </span>
                          {best(z) && <span className="block text-ink-muted tabular-nums">{best(z)}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
            {zone && (
              <button onClick={() => setPicked(null)} className="mx-auto flex min-h-11 items-center px-4 text-[14px] font-medium text-ink-faint hover:text-ink-muted">
                All zones
              </button>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
