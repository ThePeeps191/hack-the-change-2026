"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { chime, coins, knock } from "@/lib/feedback";
import type { Game, Zone } from "@/lib/contracts";
import { Notice } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { claimBounds, unitLabel } from "@/lib/claim-bounds";
import { timeKey } from "@/features/quests/problem-set";

const field = "min-h-12 w-full rounded-control bg-sunken px-4 text-[16px] text-ink placeholder:text-ink-faint";

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
      setError(message(e, "Couldn't start a game. Try again?"));
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-[24px] bg-surface p-5 shadow-card">
      <div>
        <p className="text-[17px] font-semibold">Start a Claim game</p>
        <p className="mt-1 text-[14px] leading-snug text-ink-muted">Five zones across campus. Finish a zone&apos;s challenge to claim it, then beat the best result to steal it.</p>
      </div>
      {error && <Notice tone="warning">{error}</Notice>}
      <label className="block text-[14px] font-medium text-ink-muted" htmlFor="rival">Rival crew&apos;s code (optional)</label>
      <input id="rival" className={field} value={rival} autoCapitalize="characters" placeholder="e.g. BIRCH-58Q" onChange={(e) => setRival(e.target.value)} />
      <Button className="w-full" disabled={busy} onClick={start}>{busy ? "Starting…" : "Start the game"}</Button>
    </section>
  );
}

// What you can do with the zone you tapped: take its challenge (or carry on
// with it), or send your result once the proof is approved. The result box only
// appears after the AI approves the photo, and the server checks that too.
// onChanged re-reads the game straight away, so the flag on the map flips the
// moment you take a zone instead of on the next poll.
export function ZoneActions({ game, zone, onChanged }: { game: Game; zone: Zone; onChanged?: () => void }) {
  const router = useRouter();
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const us = game.teams[0];

  // The arithmetic challenge saves its time in this browser: put it in the box.
  useEffect(() => {
    if (!zone.my_run_id || !zone.my_run_ready) return;
    try {
      const saved = localStorage.getItem(timeKey(zone.my_run_id));
      if (saved) setResult(saved); // eslint-disable-line react-hooks/set-state-in-effect -- read client-only storage after mount
    } catch {}
  }, [zone.my_run_id, zone.my_run_ready]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const run = await api.startRun({ quest_id: zone.quest_id, zone_id: zone.id });
      router.push(`/quest/${run.id}`);
    } catch (e) {
      setError(message(e, "Couldn't start the challenge. Try again?"));
      setBusy(false);
    }
  }

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const before = zone.held_by_team_id;
      const next = await api.attemptZone(game.id, zone.id, { run_id: zone.my_run_id!, result: Number(result) });
      const won = next.held_by_team_id === us?.id;
      const rival = game.teams.find((t) => t.id === before && t.id !== us?.id);
      setOutcome(
        !won ? "Not enough to take it this time. Try again?"
        : rival ? `Stolen from ${rival.name}! ${zone.name} is yours.`
        : before === us?.id ? `New best. ${zone.name} stays yours.`
        : `${zone.name} is yours. Nice work.`,
      );
      if (won) {
        chime();
        setTimeout(coins, 500);
      } else knock();
      setResult("");
      onChanged?.();
    } catch (e) {
      setError(message(e, "That didn't send. Try again?"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {error && <Notice tone="warning">{error}</Notice>}
      {outcome && <Notice>{outcome}</Notice>}
      {zone.my_run_id && zone.my_run_ready ? (
        <>
          <label className="block text-[14px] font-medium text-ink-muted" htmlFor="result">Your result{zone.result_unit ? ` (${unitLabel(zone.result_unit)})` : ""}</label>
          <input id="result" className={field} type="number" inputMode="decimal" min={claimBounds(zone.result_unit).min} max={claimBounds(zone.result_unit).max} value={result} onChange={(e) => setResult(e.target.value)} />
          <Button className="w-full" disabled={busy || result === ""} onClick={send}>Send it</Button>
        </>
      ) : (
        // Every zone says the same thing, whether you're starting or picking it back up.
        <Button className="w-full" disabled={busy} onClick={start}>{busy ? "Starting…" : "Take this challenge"}</Button>
      )}
    </div>
  );
}
