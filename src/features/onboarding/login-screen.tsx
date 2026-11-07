"use client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/lib/config";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { buttonClass } from "@/components/ui/button";
import { Hero, Stars } from "@/components/ui/hero";
import { SkySteps } from "@/components/ui/sky-steps";

// How it works, in three beats, so the first screen explains itself.
const steps = [
  { n: "1", t: "Tap “I'm free”", d: "When you've got 20 minutes." },
  { n: "2", t: "Meet at a public spot", d: "Someone nearby gets the same quest." },
  { n: "3", t: "Do one small thing together", d: "Then go on with your day." },
];

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
      <Hero fill className="min-h-dvh px-6 pt-[max(56px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
        <Stars className="opacity-60" />
        <motion.div className="relative text-center" initial={{ opacity: 0, y: 14, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease }}>
          <Hand as="h1" className="text-[72px] leading-none font-bold">{APP_NAME.toLowerCase()}</Hand>
          <p className="mx-auto mt-3 max-w-[26ch] text-[18px] leading-snug text-balance text-on-sky/90">Twenty minutes, someone new, somewhere outside.</p>
        </motion.div>

        <div className="mt-10">
          <SkySteps items={steps.map((s) => ({ badge: s.n, title: s.t, detail: s.d }))} />
        </div>

        <motion.div className="relative mx-auto mt-auto w-full max-w-[400px] space-y-2 pt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.7 }}>
          {error && <Notice tone="warning">Couldn&apos;t start the demo. Try again?</Notice>}
          {/* A plain link on purpose: signing in has to be a full page load. */}
          <a className={buttonClass("onSky", "lg", "w-full")} href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</a>
          {demo && (
            <button
              onClick={tryDemo}
              disabled={busy}
              className="flex min-h-[60px] w-full items-center justify-center rounded-[20px] bg-white/16 text-[17px] font-semibold text-[#121412] ring-1 ring-white/50 backdrop-blur-md dark:text-on-sky dark:ring-white/30 transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? "Starting…" : "Try the demo"}
            </button>
          )}
          <p className="pt-1 text-center text-[13px] text-[#121412]/75 dark:text-on-sky/85">
            For 18 and older. <a className="inline-flex min-h-11 items-center underline underline-offset-2" href="/privacy">What we keep, and why</a>
          </p>
        </motion.div>
      </Hero>
    </AppShell>
  );
}
