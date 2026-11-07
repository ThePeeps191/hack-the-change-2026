"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Crew, Quest } from "@/lib/contracts";
import { Notice } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuestRow } from "@/features/quests/quest-row";
import { ShareLink } from "@/features/invites/share-link";

const field = "min-h-12 w-full rounded-control border border-line bg-surface px-4 text-ink placeholder:text-ink-faint";

const message = (e: unknown, fallback: string) => (e instanceof ApiError && e.status !== 0 && e.status < 500 ? e.message : fallback);

// Start or join a crew when you have none.
export function NoCrewActions({ onDone }: { onDone: (crew: Crew) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(work: () => Promise<Crew>) {
    setBusy(true);
    setError(null);
    try {
      onDone(await work());
    } catch (e) {
      setError(message(e, "that didn't go through. try again?"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Notice tone="warning">{error}</Notice>}
      <Card className="space-y-2 p-4">
        <label className="block text-sm font-semibold" htmlFor="crew-name">start a crew</label>
        <input id="crew-name" className={field} value={name} maxLength={60} placeholder="the long way round" onChange={(e) => setName(e.target.value)} />
        <Button className="w-full" disabled={busy || !name.trim()} onClick={() => run(() => api.createCrew(name))}>start it</Button>
      </Card>
      <Card className="space-y-2 p-4">
        <label className="block text-sm font-semibold" htmlFor="crew-code">got a code from a friend?</label>
        <input id="crew-code" className={field} value={code} autoCapitalize="characters" placeholder="MAPLE-42" onChange={(e) => setCode(e.target.value)} />
        <Button variant="secondary" className="w-full" disabled={busy || !code.trim()} onClick={() => run(() => api.joinCrew(code))}>join</Button>
      </Card>
    </div>
  );
}

// Invite friends, and do quests together.
export function CrewActions({ crew, onChange }: { crew: Crew; onChange: () => void }) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [anywhere, setAnywhere] = useState<Quest[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.quests("anywhere").then(setAnywhere).catch(() => setAnywhere([]));
  }, []);

  async function start(quest: Quest) {
    setBusy(true);
    setError(null);
    try {
      const run = await api.startRun({ quest_id: quest.id, crew_id: crew.id });
      router.push(`/quest/${run.id}`);
    } catch (e) {
      setError(message(e, "couldn't start that one. try again?"));
      setBusy(false);
    }
  }

  async function share(quest: Quest) {
    await api.shareQuest(crew.id, quest.id).catch(() => {});
    onChange();
  }

  const sharedIds = new Set(crew.shared_quests.map((q) => q.id));
  const toShare = anywhere.filter((q) => !sharedIds.has(q.id));

  return (
    <div className="space-y-5">
      {error && <Notice tone="warning">{error}</Notice>}
      {inviting ? (
        <Card className="p-4"><ShareLink url={`${window.location.origin}/join/${crew.invite_code}`} title={`join ${crew.name} on amble`} /></Card>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => setInviting(true)}>invite friends</Button>
      )}

      {crew.shared_quests.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-muted">your crew&apos;s quests</h2>
          <Card className="divide-y divide-line/70 overflow-hidden">
            {crew.shared_quests.map((q) => (
              <div key={q.id}>
                <QuestRow quest={q} />
                <div className="px-4 pb-3"><Button className="w-full" disabled={busy} onClick={() => start(q)}>do this one</Button></div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {toShare.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-muted">work anywhere, so friends in other cities can join</h2>
          <Card className="divide-y divide-line/70 overflow-hidden">
            {toShare.map((q) => (
              <div key={q.id}>
                <QuestRow quest={q} />
                <div className="px-4 pb-3"><Button variant="secondary" className="w-full" onClick={() => share(q)}>send to the crew</Button></div>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
