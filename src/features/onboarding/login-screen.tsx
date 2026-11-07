"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/lib/config";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { Button, buttonClass } from "@/components/ui/button";
import { Hero } from "@/components/ui/hero";

export function LoginScreen({ demo, returnTo }: { demo: boolean; returnTo: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function tryDemo() {
    setBusy(true);
    setError(false);
    const res = await fetch("/api/demo-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Guest" }),
    }).catch(() => null);
    if (res?.ok) router.replace(returnTo);
    else {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <AppShell nav={false}>
      <Hero className="flex flex-1 flex-col justify-center pt-[env(safe-area-inset-top)] pb-16">
        <Hand as="h1" className="text-center text-[64px] leading-none font-bold">{APP_NAME.toLowerCase()}</Hand>
        <p className="mx-auto mt-3 max-w-[28ch] text-center text-[17px] leading-snug text-on-sky/90">Twenty minutes, someone new, somewhere outside.</p>
      </Hero>
      <div className="space-y-2 px-4 pt-6 pb-6">
        {error && <Notice tone="warning">Couldn&apos;t start the demo. Try again?</Notice>}
        {/* A plain link on purpose: signing in has to be a full page load. */}
        <a className={buttonClass("primary", "lg", "w-full")} href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</a>
        {demo && <Button size="lg" variant="secondary" onClick={tryDemo} disabled={busy}>{busy ? "Starting…" : "Try the demo"}</Button>}
        <p className="pt-2 text-center text-[13px] text-ink-muted">For 18 and older. <a className="underline" href="/privacy">What we keep, and why</a></p>
      </div>
    </AppShell>
  );
}
