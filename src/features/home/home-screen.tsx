"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { APP_NAME, QUEST_MINUTES } from "@/lib/config";
import type { Quest, User } from "@/lib/contracts";
import { getPosition } from "@/lib/geo";
import { AppShell, Notice } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Card, Chip, Skeleton } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { QuestRow } from "@/features/quests/quest-row";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "still up?";
  if (h < 12) return "good morning";
  if (h < 17) return "good afternoon";
  return "good evening";
}

export function HomeScreen() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.me().then(setMe).catch(() => {});
    api.quests().then((q) => setQuests(q.filter((x) => x.type !== "anywhere").slice(0, 3))).catch(() => setQuests([]));
  }, []);

  async function goFree() {
    setBusy(true);
    setError(null);
    try {
      const pos = await getPosition();
      await api.setFree(pos.lat, pos.lng);
      router.push(pos.approximate ? "/match?approx=1" : "/match");
    } catch {
      setError("couldn't reach amble just now. check your signal and try again?");
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 pt-4">
        <span className="text-xl font-extrabold tracking-tight">{APP_NAME.toLowerCase()}</span>
        {me && <Chip tone="neutral" className="tabular-nums">{me.coins} coins</Chip>}
      </header>

      <section className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
        <Mascot mood="idle" size={88} />
        <p className="mt-4 text-sm font-semibold text-ink-muted">{greeting()}{me ? `, ${me.display_name.toLowerCase()}` : ""}</p>
        <h1 className="mt-1 text-[34px] leading-[1.05] font-extrabold tracking-tight">free for {QUEST_MINUTES} min?</h1>
        <p className="mt-2 max-w-[32ch] text-ink-muted">we&apos;ll find someone nearby who is too, and a small quest for the two of you.</p>
      </section>

      <section className="px-4">
        <h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-muted">quests around here</h2>
        <Card className="divide-y divide-line/70 overflow-hidden">
          {quests === null
            ? [0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="size-7 rounded-full" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                </div>
              ))
            : quests.length === 0
              ? <p className="px-4 py-5 text-sm text-ink-muted">no quests nearby yet. say you&apos;re free and we&apos;ll make one up.</p>
              : quests.map((q) => <QuestRow key={q.id} quest={q} />)}
        </Card>
      </section>

      <div className="mt-auto px-4 pt-6 pb-4">
        {error && <div className="mb-3"><Notice tone="danger">{error}</Notice></div>}
        <Button size="lg" onClick={goFree} disabled={busy}>
          {busy ? "finding your spot…" : "i'm free"}
        </Button>
        <p className="mt-2 text-center text-[13px] text-ink-muted">you both say yes before anything happens.</p>
      </div>
    </AppShell>
  );
}
