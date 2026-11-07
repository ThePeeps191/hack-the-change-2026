"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Game, Zone } from "@/lib/contracts";
import { Notice } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const field = "min-h-12 w-full rounded-control border border-line bg-surface px-4 text-ink placeholder:text-ink-faint";

const message = (e: unknown, fallback: string) => (e instanceof ApiError && e.status !== 0 && e.status < 500 ? e.message : fallback);

// Shown when your crew has no game yet.
export function NoGame({ onStarted }: { onStarted: (game: Game) => void }) {
  const [rival, setRival] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      onStarted(await api.createGame({ rival_code: rival.trim() || undefined }));
    } catch (e) {
      setError(message(e, "couldn't start a game. try again?"));
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div>
        <p className="font-semibold">start a claim game</p>
        <p className="mt-1 text-sm text-ink-muted">five zones across campus. finish a zone&apos;s challenge to claim it, then beat the best result to steal it.</p>
      </div>
      {error && <Notice tone="warning">{error}</Notice>}
      <label className="block text-sm font-semibold" htmlFor="rival">rival crew&apos;s code (optional)</label>
      <input id="rival" className={field} value={rival} autoCapitalize="characters" placeholder="CEDAR-17" onChange={(e) => setRival(e.target.value)} />
      <Button className="w-full" disabled={busy} onClick={start}>{busy ? "starting…" : "start the game"}</Button>
    </Card>
  );
}

// What you can do with the zone you tapped: start its challenge, carry on with
// it, or send your result once the proof is approved.
export function ZoneActions({ game, zone }: { game: Game; zone: Zone }) {
  const router = useRouter();
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const us = game.teams[0];

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const run = await api.startRun({ quest_id: zone.quest_id, zone_id: zone.id });
      router.push(`/quest/${run.id}`);
    } catch (e) {
      setError(message(e, "couldn't start the challenge. try again?"));
      setBusy(false);
    }
  }

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const next = await api.attemptZone(game.id, zone.id, { run_id: zone.my_run_id!, result: Number(result) });
      setOutcome(next.held_by_team_id === us?.id ? "it's yours. nice work." : "not enough to take it this time. try again?");
      setResult("");
    } catch (e) {
      setError(message(e, "that didn't send. try again?"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {zone.quest && <p className="text-sm text-ink-muted">{zone.quest.description}</p>}
      {error && <Notice tone="warning">{error}</Notice>}
      {outcome && <Notice>{outcome}</Notice>}
      {zone.my_run_id && zone.my_run_ready ? (
        <>
          <label className="block text-sm font-semibold" htmlFor="result">your result{zone.result_unit ? ` (${zone.result_unit})` : ""}</label>
          <input id="result" className={field} type="number" inputMode="decimal" value={result} onChange={(e) => setResult(e.target.value)} />
          <Button className="w-full" disabled={busy || result === ""} onClick={send}>send it</Button>
        </>
      ) : zone.my_run_id ? (
        <Button className="w-full" disabled={busy} onClick={start}>{busy ? "joining…" : "join the challenge"}</Button>
      ) : (
        <Button className="w-full" disabled={busy} onClick={start}>{busy ? "starting…" : "take this challenge"}</Button>
      )}
    </div>
  );
}
