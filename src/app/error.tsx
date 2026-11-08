"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Button, buttonClass } from "@/components/ui/button";
import { Hero, Stars } from "@/components/ui/hero";

// If a screen crashes (say the map can't start its 3D view on an old phone),
// this replaces Next's bare error page: our sky, a plain sentence, and two ways on.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppShell nav={false}>
      <Hero fill className="min-h-dvh px-6 pt-[max(72px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
        <Stars className="opacity-60" />
        <div className="relative text-center">
          <Hand as="h1" className="text-[56px] leading-none font-bold">hmm</Hand>
          <p className="mx-auto mt-3 max-w-[28ch] text-[17px] leading-snug text-balance">This screen tripped over something. Your quests and coins are safe.</p>
        </div>
        <div className="relative mx-auto mt-auto flex w-full max-w-[400px] flex-col gap-2 pt-8">
          <Button variant="onSky" size="lg" onClick={() => retry()}>Try again</Button>
          <Link href="/" className={buttonClass("quiet", "lg", "w-full text-on-sky hover:text-on-sky")}>Back to today</Link>
        </div>
      </Hero>
    </AppShell>
  );
}
