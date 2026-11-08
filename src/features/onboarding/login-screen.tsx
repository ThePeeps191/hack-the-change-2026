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
    <AppShell nav={false} wide>
      {/* Paper, not sky: the sky lives inside the glass panes. On a computer
          the words and buttons sit on the left and the panes on the right. */}
      <div className="flex min-h-dvh flex-1 flex-col lg:mx-auto lg:grid lg:w-full lg:max-w-[1120px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[1fr_auto_1fr] lg:gap-x-14 lg:px-10 px-5 pt-[max(44px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
        <motion.div className="text-center lg:col-start-1 lg:row-start-2 lg:text-left" initial={{ opacity: 0, y: 14, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease }}>
          <Hand as="h1" className="text-[64px] lg:text-[88px] leading-none font-bold text-ink">{APP_NAME.toLowerCase()}</Hand>
          <p className="mx-auto mt-2 max-w-[26ch] text-[17px] lg:mx-0 lg:text-[20px] leading-snug text-balance text-ink-muted">Twenty minutes, someone new, somewhere outside.</p>
        </motion.div>

        <div className="mt-4 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mt-0 lg:self-center">
          <SkyPanes />
        </div>

        <motion.div className="mx-auto mt-auto w-full max-w-[400px] space-y-2 pt-4 lg:col-start-1 lg:row-start-3 lg:mx-0 lg:mt-0 lg:self-start lg:pt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.7 }}>
          {error && <Notice tone="warning">Couldn&apos;t start the demo. Try again?</Notice>}
          {/* A plain link on purpose: signing in has to be a full page load. */}
          {/* With the demo on, "Try the demo" leads: most people here are judges without a student email. */}
          {demo && (
            <button onClick={tryDemo} disabled={busy} className={buttonClass("primary", "lg", "w-full disabled:opacity-60")}>
              {busy ? "Starting…" : "Try the demo"}
            </button>
          )}
          <a className={buttonClass(demo ? "secondary" : "primary", "lg", "w-full")} href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</a>
          <p className="pt-1 text-center text-[13px] text-ink-muted lg:text-left">
            <a className="inline-flex min-h-11 items-center underline underline-offset-2" href="/privacy">What we keep, and why</a>
          </p>
        </motion.div>
      </div>
    </AppShell>
  );
}
