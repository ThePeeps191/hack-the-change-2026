"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { QUEST_MINUTES } from "@/lib/config";
import { getPosition } from "@/lib/geo";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { ButtonLink, MagneticButton } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";

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
      setError(e instanceof ApiError && e.status !== 0 ? e.message : "Couldn't reach Amble. Check your signal and try again.");
      setBusy(false);
    }
  }

  return (
    <AppShell nav={false}>
      <Hero className="pb-10">
        <HeroBar left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />} center="an invite" />
        <Hand as="h1" className="mt-6 text-center text-[40px] leading-none font-bold">free for {QUEST_MINUTES} min?</Hand>
        <p className="mx-auto mt-3 max-w-[30ch] text-center text-[15px] leading-snug text-on-sky/85">Someone you just met wants to do a small quest with you.</p>
      </Hero>
      <div className="flex flex-1 flex-col px-4 pt-6">
        <p className="rounded-[24px] bg-surface p-5 text-[15px] leading-snug text-ink-muted shadow-card">
          You&apos;ll meet at the quest spot, somewhere public. You only share a first name, and you can leave any time.
        </p>
      </div>
      <div className="space-y-2 px-4 pt-6 pb-6">
        {error && <Notice tone="warning">{error}</Notice>}
        <MagneticButton onClick={accept} disabled={busy}>{busy ? "Starting…" : "Yes, let's go"}</MagneticButton>
        <ButtonLink size="lg" variant="quiet" href="/">Not this time</ButtonLink>
      </div>
    </AppShell>
  );
}
