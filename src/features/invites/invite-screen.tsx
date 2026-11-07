"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { QUEST_MINUTES } from "@/lib/config";
import { getPosition } from "@/lib/geo";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";

export function InviteScreen() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Someone new has to confirm they're 18+ before meeting anyone.
  useEffect(() => {
    api.me().then((u) => { if (!u.age_confirmed_at) router.replace(`/welcome?next=/invite/${code}`); }).catch(() => {});
  }, [code, router]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const pos = await getPosition();
      const match = await api.acceptInvite(code, { lat: pos.lat, lng: pos.lng });
      router.push(match.run_id ? `/quest/${match.run_id}` : "/match");
    } catch (e) {
      setError(e instanceof ApiError && e.status !== 0 ? e.message : "couldn't reach amble. check your signal and try again?");
      setBusy(false);
    }
  }

  return (
    <AppShell nav={false}>
      <TopBar back="/" title="an invite" />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <Mascot mood="matched" size={96} />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">free for {QUEST_MINUTES} min?</h1>
        <p className="mt-2 max-w-[32ch] text-ink-muted">someone you met wants to do a small quest with you.</p>
        <Card className="mt-5 w-full p-4 text-left text-sm text-ink-muted">
          you&apos;ll meet at the quest spot, somewhere public. you only share a first name, and you can leave any time.
        </Card>
      </div>
      <div className="space-y-2 px-4 pb-6">
        {error && <Notice tone="warning">{error}</Notice>}
        <Button size="lg" onClick={accept} disabled={busy}>{busy ? "starting…" : "yes, let's go"}</Button>
        <ButtonLink size="lg" variant="quiet" href="/">not this time</ButtonLink>
      </div>
    </AppShell>
  );
}
