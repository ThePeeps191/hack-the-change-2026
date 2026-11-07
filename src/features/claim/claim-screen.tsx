"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Zone } from "@/lib/contracts";
import { usePoll } from "@/lib/use-poll";
import { AppShell, TopBar } from "@/components/ui/app-shell";
import { Card, Chip, Skeleton } from "@/components/ui/card";
import { MiniMap } from "@/features/map/mini-map";
import { NoGame, ZoneActions } from "./claim-actions";

// GET /api/games/current is your crew's active game.
const GAME_ID = "current";

export function ClaimScreen() {
  const [started, setStarted] = useState(0);
  const { data: game, error } = usePoll(() => api.game(GAME_ID), { ms: 5000, key: started });
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = game?.zones.find((z) => z.id === pickedId) ?? null;
  const us = game?.teams[0];

  const tone = (z: Zone) => (z.held_by_team_id == null ? "free" : z.held_by_team_id === us?.id ? "ours" : "theirs");
  const colors = { free: "var(--color-ink-faint)", ours: "var(--color-accent)", theirs: "var(--color-anywhere)" };

  return (
    <AppShell>
      <TopBar back="/crew" title="claim" right={game && <Chip tone="accent">{game.name}</Chip>} />
      <div className="space-y-3 px-4">
        {!game && error ? (
          <NoGame onStarted={() => setStarted((n) => n + 1)} />
        ) : !game ? (
          <Skeleton className="aspect-square w-full rounded-card" />
        ) : (
          <>
            <div className="flex gap-3 text-[13px] font-semibold text-ink-muted">
              <span className="flex items-center gap-1.5"><i className="size-3 rounded-full bg-accent" />{us?.name}</span>
              {game.teams[1] && <span className="flex items-center gap-1.5"><i className="size-3 rounded-full bg-anywhere" />{game.teams[1].name}</span>}
            </div>
            <MiniMap
              pins={game.zones.map((z) => ({
                id: z.id,
                lat: z.lat,
                lng: z.lng,
                label: z.name,
                node: (
                  <button
                    onClick={() => setPickedId(z.id)}
                    aria-label={`${z.name}, ${tone(z)}`}
                    className="size-11 rounded-full border-4 border-surface shadow-card transition-transform active:scale-95"
                    style={{ background: colors[tone(z)], outline: picked?.id === z.id ? "3px solid var(--color-ink)" : undefined }}
                  />
                ),
              }))}
            />
            <Card className="p-4">
              {picked ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">{picked.name}</p>
                    <Chip tone={tone(picked) === "ours" ? "success" : tone(picked) === "theirs" ? "warning" : "neutral"}>
                      {tone(picked) === "ours" ? "yours" : tone(picked) === "theirs" ? "theirs" : "unclaimed"}
                    </Chip>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {picked.best_result != null
                      ? `best so far: ${picked.best_result} ${picked.result_unit ?? ""}. beat it to take the zone.`
                      : "nobody has claimed this yet. finish its challenge to take it."}
                  </p>
                  <ZoneActions game={game} zone={picked} />
                </>
              ) : (
                <p className="text-sm text-ink-muted">tap a zone to see its challenge and who holds it.</p>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
