"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Crew, Quest } from "@/lib/contracts";
import { tick } from "@/lib/feedback";
import { Hand, Notice } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { QuestCard } from "@/features/quests/quest-card";

const field = "min-h-12 w-full rounded-control bg-sunken px-4 text-[16px] text-ink placeholder:text-ink-faint";

const message = (e: unknown, fallback: string) => (e instanceof ApiError && e.status !== 0 && e.status < 500 ? e.message : fallback);

// Start or join a crew when you have none.
export function NoCrewActions({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(work: () => Promise<Crew>) {
    tick();
    setBusy(true);
    setError(null);
    try {
      await work();
      onDone();
    } catch (e) {
      setError(message(e, "That didn't go through. Try again?"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Notice tone="warning">{error}</Notice>}
      <section className="space-y-2.5 rounded-[24px] bg-surface p-5 shadow-card">
        <label className="block text-[17px] font-semibold" htmlFor="crew-name">Start a crew</label>
        <input id="crew-name" className={field} value={name} maxLength={60} placeholder="The long way round" onChange={(e) => setName(e.target.value)} />
        <Button className="w-full" disabled={busy || !name.trim()} onClick={() => run(() => api.createCrew(name))}>Start it</Button>
      </section>
      <section className="space-y-2.5 rounded-[24px] bg-surface p-5 shadow-card">
        <label className="block text-[17px] font-semibold" htmlFor="crew-code">Got a code from a friend?</label>
        <input id="crew-code" className={field} value={code} autoCapitalize="characters" placeholder="MAPLE-42" onChange={(e) => setCode(e.target.value)} />
        <Button variant="secondary" className="w-full" disabled={busy || !code.trim()} onClick={() => run(() => api.joinCrew(code))}>Join</Button>
      </section>
    </div>
  );
}

// A shared quest you can start. Friends who tap the same one land on the same run.
export function StartQuestCard({ crewId, quest }: { crewId: string; quest: Quest }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    tick();
    setBusy(true);
    setError(null);
    try {
      const run = await api.startRun({ quest_id: quest.id, crew_id: crewId });
      router.push(`/quest/${run.id}`);
    } catch (e) {
      setError(message(e, "Couldn't start that one. Try again?"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={start} disabled={busy} className="block w-full text-left disabled:opacity-60" aria-label={`Start ${quest.title}`}>
        <QuestCard quest={quest} />
      </button>
      {error && <Notice tone="warning">{error}</Notice>}
    </div>
  );
}

// Quests that work in any city, so friends who are apart can still play.
export function AnywhereQuests({ crew, onChange }: { crew: Crew; onChange: () => void }) {
  const [anywhere, setAnywhere] = useState<Quest[]>([]);

  useEffect(() => {
    api.quests("anywhere").then(setAnywhere).catch(() => setAnywhere([]));
  }, []);

  const shared = new Set(crew.shared_quests.map((q) => q.id));
  const toShare = anywhere.filter((q) => !shared.has(q.id));
  if (toShare.length === 0) return null;

  async function share(quest: Quest) {
    tick(0.8);
    await api.shareQuest(crew.id, quest.id).catch(() => {});
    onChange();
  }

  return (
    <section aria-labelledby="anywhere">
      <Hand as="h2" className="mb-1 px-1 text-[26px] leading-none font-bold"><span id="anywhere">from anywhere</span></Hand>
      <p className="mb-2.5 px-1 text-[14px] text-ink-muted">These work in any city. Send one to the crew and race each other.</p>
      <div className="flex flex-col gap-2.5">
        {toShare.map((q) => (
          <div key={q.id} className="space-y-2">
            <QuestCard quest={q} />
            <Button variant="secondary" className="w-full" onClick={() => share(q)}>Send to the crew</Button>
          </div>
        ))}
      </div>
    </section>
  );
}
