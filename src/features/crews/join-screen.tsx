"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { ButtonLink, MagneticButton } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";

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
      setError(e instanceof ApiError && e.status !== 0 ? e.message : "Couldn't reach Amble. Try again?");
      setBusy(false);
    }
  }

  return (
    <AppShell nav={false}>
      <Hero className="pb-10">
        <HeroBar left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />} center="a crew invite" />
        <Hand as="h1" className="mt-6 text-center text-[40px] leading-none font-bold">join the crew?</Hand>
        <p className="mx-auto mt-3 max-w-[30ch] text-center text-[15px] leading-snug text-on-sky/85">You&apos;ll share quests, earn coins together and play Claim on the map.</p>
      </Hero>
      <div className="flex-1" />
      <div className="space-y-2 px-4 pt-6 pb-6">
        {error && <Notice tone="warning">{error}</Notice>}
        <MagneticButton onClick={join} disabled={busy}>{busy ? "Joining…" : "Join"}</MagneticButton>
        <ButtonLink size="lg" variant="quiet" href="/">Not now</ButtonLink>
      </div>
    </AppShell>
  );
}
