"use client";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Quest, Zone } from "@/lib/contracts";
import { usePoll } from "@/lib/use-poll";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Skeleton } from "@/components/ui/card";
import type { GlobeMarker } from "@/components/map/globe-map";
import { MagneticButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/app-shell";
import { useStartRun } from "@/features/quests/use-start-run";
import { GAME_ID } from "./game";

const GlobeMap = dynamic(() => import("@/components/map/globe-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse" style={{ background: "linear-gradient(180deg, var(--color-sky-top), var(--color-sky-bottom))" }} />,
});


const colors = { free: "#9aa09a", ours: "var(--color-accent)", theirs: "var(--color-anywhere)" };

export function ClaimScreen() {
  const { data: game } = usePoll(() => api.game(GAME_ID), { ms: 5000 });
  const [picked, setPicked] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const run = useStartRun();
  const [quests, setQuests] = useState<Quest[]>([]);
  useEffect(() => {
    api.quests().then(setQuests).catch(() => {});
  }, []);
  const us = game?.teams[0];
  const them = game?.teams[1];

  const tone = (z: Zone) => (z.held_by_team_id == null ? "free" : z.held_by_team_id === us?.id ? "ours" : "theirs");
  const markers = useMemo<GlobeMarker[]>(
    () => (game?.zones ?? []).map((z) => ({ id: z.id, lat: z.lat, lng: z.lng, label: z.name, color: colors[tone(z)] })),
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
        animate={{ height: zone ? "42dvh" : "60dvh" }}
        transition={{ type: "spring", stiffness: 260, damping: 34 }}
      >
        <GlobeMap markers={markers} selected={picked} onSelect={choose} focus={focus} intro={false} />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-[max(8px,env(safe-area-inset-top))]">
          <Link href="/crew" aria-label="Back to crew" className="pointer-events-auto grid size-11 place-items-center rounded-full bg-surface/85 text-ink shadow-card backdrop-blur-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14.5 5.5L8 12l6.5 6.5" />
            </svg>
          </Link>
          {game && (
            <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-surface/85 px-4 py-2 text-[14px] font-semibold text-ink shadow-card backdrop-blur-md">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent" />{held.ours}</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-anywhere" />{held.theirs}</span>
              <span className="flex items-center gap-1.5 text-ink-muted"><span className="size-2.5 rounded-full bg-[#9aa09a]" />{held.free}</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="space-y-4 px-4 pt-5">
        {!game ? (
          <Skeleton className="h-28 rounded-[24px]" />
        ) : (
          <>
            <div className="px-1">
              <Hand as="h1" className="text-[34px] leading-none font-bold">{game.name.toLowerCase()}</Hand>
              <p className="mt-1.5 text-[15px] text-ink-muted">
                <span className="font-semibold text-accent">{us?.name}</span> vs <span className="font-semibold text-anywhere">{them?.name}</span>. Beat a zone&apos;s best to take it.
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
                  <div className="flex items-center gap-2 text-[13px] text-ink-muted">
                    <span className="size-2 rounded-full" style={{ background: colors[tone(zone)] }} />
                    {tone(zone) === "ours" ? `Held by ${us?.name}` : tone(zone) === "theirs" ? `Held by ${them?.name}` : "Nobody holds this yet"}
                  </div>
                  <p className="mt-2 text-[22px] leading-tight font-semibold tracking-[-0.01em]">{zone.name}</p>
                  {(() => {
                    const zq = zone.quest ?? quests.find((x) => x.id === zone.quest_id);
                    return zq && <p className="mt-1.5 text-[15px] leading-snug text-ink-muted">{zq.description}</p>;
                  })()}
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
                  {tone(zone) !== "ours" && (
                    <div className="mt-4">
                      <MagneticButton onClick={() => run.start({ quest_id: zone.quest_id, zone_id: zone.id, crew_id: us?.crew_id })} disabled={run.busy}>
                        {run.busy ? "Starting…" : tone(zone) === "theirs" ? "Take it back" : "Claim it"}
                      </MagneticButton>
                    </div>
                  )}
                  {tone(zone) === "ours" && <p className="mt-3 text-[14px] text-ink-muted">Yours for now. Someone can still beat it.</p>}
                  {run.error && <div className="pt-2"><Notice tone="danger">{run.error}</Notice></div>}
                </motion.div>
              ) : (
                <motion.ul key="list" className="rows overflow-hidden rounded-[24px] bg-surface shadow-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {game.zones.map((z) => (
                    <li key={z.id}>
                      <button onClick={() => choose(z.id)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken/60">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: colors[tone(z)] }} />
                        <span className="flex-1 text-[16px] font-medium">{z.name}</span>
                        <span className="text-[14px] text-ink-muted tabular-nums">{z.best_result != null ? `${z.best_result} ${z.result_unit ?? ""}` : "open"}</span>
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
