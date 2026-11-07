"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { AppShell, Notice } from "@/components/ui/app-shell";
import { Button, buttonClass } from "@/components/ui/button";
import { Mascot } from "@/components/ui/mascot";

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
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <Mascot mood="idle" size={104} />
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{APP_NAME.toLowerCase()}</h1>
        <p className="mt-2 max-w-[30ch] text-ink-muted">{APP_TAGLINE}</p>
      </div>
      <div className="space-y-2 px-4 pb-6">
        {error && <Notice tone="warning">couldn&apos;t start the demo. try again?</Notice>}
        {/* A plain link on purpose: this has to be a full page load, not a client navigation. */}
        <a className={buttonClass("primary", "lg", "w-full")} href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>sign in</a>
        {demo && <Button size="lg" variant="secondary" onClick={tryDemo} disabled={busy}>{busy ? "starting…" : "try the demo"}</Button>}
        <p className="pt-1 text-center text-[13px] text-ink-muted">for 18 and older. <a className="underline" href="/privacy">what we keep, and why</a></p>
      </div>
    </AppShell>
  );
}
