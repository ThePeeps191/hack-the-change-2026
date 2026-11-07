"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AppShell, Notice, TopBar } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Mascot } from "@/components/ui/mascot";

export function JoinScreen() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      await api.joinCrew(code);
      router.push("/crew");
    } catch (e) {
      setError(e instanceof ApiError && e.status !== 0 ? e.message : "couldn't reach amble. try again?");
      setBusy(false);
    }
  }

  return (
    <AppShell nav={false}>
      <TopBar back="/" title="a crew invite" />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <Mascot mood="cheer" size={96} />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">join the crew?</h1>
        <p className="mt-2 max-w-[32ch] text-ink-muted">you&apos;ll share quests, earn coins together and play claim on the map.</p>
      </div>
      <div className="space-y-2 px-4 pb-6">
        {error && <Notice tone="warning">{error}</Notice>}
        <Button size="lg" onClick={join} disabled={busy}>{busy ? "joining…" : "join"}</Button>
        <ButtonLink size="lg" variant="quiet" href="/">not now</ButtonLink>
      </div>
    </AppShell>
  );
}
