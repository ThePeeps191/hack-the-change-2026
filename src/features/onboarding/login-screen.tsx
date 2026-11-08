"use client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/lib/config";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { buttonClass } from "@/components/ui/button";
import { SkyPanes } from "./sky-panes";

const ease = [0.16, 1, 0.3, 1] as const;

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
      {/* Paper, not sky: the sky lives inside the glass panes. */}
      <main className="flex min-h-dvh flex-1 flex-col px-5 pt-[max(44px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
        <motion.div className="text-center" initial={{ opacity: 0, y: 14, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease }}>
          <Hand as="h1" className="text-[64px] leading-none font-bold text-ink">{APP_NAME.toLowerCase()}</Hand>
          <p className="mx-auto mt-2 max-w-[26ch] text-[17px] leading-snug text-balance text-ink-muted">Twenty minutes, someone new, somewhere outside.</p>
        </motion.div>

        <div className="mt-4">
          <SkyPanes />
        </div>

        <motion.div className="mx-auto mt-auto w-full max-w-[400px] space-y-2 pt-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.7 }}>
          {error && <Notice tone="warning">Couldn&apos;t start the demo. Try again?</Notice>}
          {/* A plain link on purpose: signing in has to be a full page load. */}
          <a className={buttonClass("primary", "lg", "w-full")} href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</a>
          {demo && (
            <button onClick={tryDemo} disabled={busy} className={buttonClass("secondary", "lg", "w-full disabled:opacity-60")}>
              {busy ? "Starting…" : "Try the demo"}
            </button>
          )}
          <p className="pt-1 text-center text-[13px] text-ink-muted">
            For 18 and older. <a className="inline-flex min-h-11 items-center underline underline-offset-2" href="/privacy">What we keep, and why</a>
          </p>
        </motion.div>
      </main>
    </AppShell>
  );
}
