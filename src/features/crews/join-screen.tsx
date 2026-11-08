"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AppShell, Hand } from "@/components/ui/app-shell";
import Link from "next/link";
import { buttonClass, MagneticButton } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon, Stars } from "@/components/ui/hero";
import { SkySteps, skyQuiet } from "@/components/ui/sky-steps";

const GROUP = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="8.5" cy="12" r="3.2" /><circle cx="15.5" cy="12" r="3.2" /></svg>;
const COIN = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /></svg>;
const FLAG = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 21V4M6 4h11l-2.5 4L17 12H6" /></svg>;

export function JoinScreen() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // If you're already in the crew this link is for, say so instead of asking you to join.
  const [mine, setMine] = useState<string | null>(null);
  useEffect(() => {
    api.crews().then((cs) => setMine(cs.find((c) => c.invite_code.toLowerCase() === code.toLowerCase())?.name ?? null)).catch(() => {});
  }, [code]);

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
      <Hero fill className="min-h-dvh pb-[max(20px,env(safe-area-inset-bottom))]">
        <Stars className="opacity-50" />
        <HeroBar left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />} center="a crew invite" />
        <Hand as="h1" className="relative mt-6 text-center text-[44px] leading-none font-bold">{mine ? "you're already in" : "join the crew?"}</Hand>
        <p className="relative mx-auto mt-3 max-w-[30ch] text-center text-[16px] leading-snug text-balance text-on-sky/90">
          {mine ? <>This link is for {mine}, and you&apos;re one of them.</> : "A crew is a few friends who get outside together, wherever each of you is."}
        </p>
        <div className="mt-9 px-4">
          <SkySteps
            items={[
              { badge: GROUP, title: "do quests together", detail: "Or race each other from anywhere." },
              { badge: COIN, title: "earn coins as a crew", detail: "And climb the weekly board." },
              { badge: FLAG, title: "play Claim", detail: "Hold spots on the map." },
            ]}
          />
        </div>
        <div className="relative mx-auto mt-auto w-full max-w-[400px] space-y-1 px-4 pt-8">
          {error && <p role="alert" className="pb-3 text-center text-[15px] leading-snug font-medium text-balance">{error}</p>}
          {mine ? (
            <Link href="/crew" className={buttonClass("onSky", "lg", "w-full")}>Open {mine}</Link>
          ) : (
            <>
              <MagneticButton variant="onSky" onClick={join} disabled={busy}>{busy ? "Joining…" : "Join the crew"}</MagneticButton>
              <Link className={skyQuiet} href="/">Not now</Link>
            </>
          )}
        </div>
      </Hero>
    </AppShell>
  );
}
