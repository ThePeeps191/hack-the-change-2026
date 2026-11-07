"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Recap } from "@/lib/contracts";
import { distance } from "@/lib/format";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, Skeleton, Stat } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { MoodCheck } from "@/features/checkin/mood-check";
import { RecapExtras } from "./recap-extras";

export function RecapScreen() {
  const { runId } = useParams<{ runId: string }>();
  const [recap, setRecap] = useState<Recap | null>(null);
  const [error, setError] = useState(false);
  const [kept, setKept] = useState<null | "asked" | "connected">(null);

  useEffect(() => {
    api.recap(runId).then(setRecap).catch(() => setError(true));
  }, [runId]);

  async function stayInTouch() {
    setKept("asked");
    const r = await api.connect(runId).catch(() => null);
    if (r?.connected) setKept("connected");
  }

  return (
    <AppShell nav={false}>
      <TopBar back="/" title="recap" />
      <div className="flex-1 space-y-4 px-4">
        {error && <Notice tone="warning">the recap is still being written. check back in a minute.</Notice>}
        {!recap && !error && (
          <>
            <Skeleton className="h-28 w-full rounded-card" />
            <Skeleton className="h-24 w-full rounded-card" />
          </>
        )}
        {recap && (
          <>
            <div className="flex items-center gap-4 pt-2">
              <Mascot mood="cheer" size={64} />
              <div>
                <p className="text-[13px] font-semibold text-ink-muted">quest complete</p>
                <h1 className="text-2xl leading-tight font-extrabold tracking-tight">{recap.title ?? "nice one"}</h1>
              </div>
            </div>
            <Card className="grid grid-cols-3 gap-2 p-4">
              <Stat label="minutes" value={recap.duration_min ?? "–"} />
              <Stat label="walked" value={recap.distance_m != null ? distance(recap.distance_m) : "–"} />
              <Stat label="coins" value={recap.coins != null ? `+${recap.coins}` : "–"} />
            </Card>
            <Card className="p-4">
              <p className="leading-relaxed">{recap.summary}</p>
            </Card>
            <RecapExtras recap={recap} />
            <MoodCheck runId={runId} phase="after" />
            {recap.partner && (
              <Card className="p-4">
                <p className="font-semibold">stay in touch with {recap.partner.display_name}?</p>
                <p className="mt-1 text-sm text-ink-muted">you&apos;ll only connect if you both say yes. no pressure either way.</p>
                <Button className="mt-3 w-full" variant={kept ? "secondary" : "primary"} disabled={kept !== null} onClick={stayInTouch}>
                  {kept === "connected" ? `you're connected with ${recap.partner.display_name}` : kept === "asked" ? "asked…" : "yes, add them"}
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
      <div className="px-4 pt-4 pb-6">
        <ButtonLink size="lg" variant="secondary" href="/">done</ButtonLink>
      </div>
    </AppShell>
  );
}
