"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Split } from "@/components/ui/split";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { Button, buttonClass } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";

const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// Everything we keep, each with a small icon, what it is and why.
const KEPT: { icon: React.ReactNode; what: string; why: string }[] = [
  {
    icon: <g {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.2" /></g>,
    what: "Your location while searching",
    why: "Used to find someone nearby, then deleted the moment you're matched. Your partner only sees a rough distance. To find places for quests we look up the area, rounded to about 100 m, on OpenStreetMap.",
  },
  {
    icon: <g {...p}><path d="M5 19c2.5-.3 3.5-2.6 4.6-5.4C11 10.3 13 8.6 19 6.5" strokeDasharray="0.1 3.2" strokeWidth={2.2} /><circle cx="5" cy="19" r="1.6" /><circle cx="19" cy="6.5" r="1.6" /></g>,
    what: "Your route during a quest",
    why: "Recorded only while a quest is active, shown only to you, and deleted after 30 days.",
  },
  {
    icon: <g {...p}><rect x="3.5" y="6.5" width="17" height="13" rx="3" /><circle cx="12" cy="13" r="3.4" /><path d="M9 6.5l1.2-2h3.6l1.2 2" /></g>,
    what: "Proof photos and videos",
    why: "Checked by an AI model (Claude by Anthropic, or Google's Gemini), and seen only by the people on that quest.",
  },
  {
    icon: <g {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" /></g>,
    what: "Your name",
    why: "A first name, shown only after you both say yes. We never share your email or contact details.",
  },
  {
    icon: <g {...p}><circle cx="12" cy="12" r="8" /><path d="M8.8 14.2c.8 1 1.9 1.6 3.2 1.6s2.4-.6 3.2-1.6M9.3 10h.01M14.7 10h.01" strokeWidth={2.2} /></g>,
    what: "Mood check-ins",
    why: "Only ever shown to you, never ranked, and always optional.",
  },
];

export function PrivacyScreen({ shared = false }: { shared?: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function remove() {
    setBusy(true);
    setError(false);
    try {
      await api.deleteMe();
      router.replace("/");
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <AppShell nav={false} wide>
      <Split fill aside={
      <Hero className="pb-8">
        <HeroBar left={<HeroIcon href="/me" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />} center="you" />
        <Hand as="h1" className="pt-2 text-center text-[40px] leading-none font-bold">your data</Hand>
        <p className="mx-auto mt-2 max-w-[30ch] px-6 text-center text-[15px] leading-snug text-balance text-on-sky/90">Everything we keep, and why, in plain words.</p>
      </Hero>
      }>

      <div className="flex-1 space-y-4 px-4 pt-6 pb-6">
        <ul className="rows overflow-hidden rounded-[24px] bg-surface shadow-card">
          {KEPT.map((k, i) => (
            <motion.li
              key={k.what}
              className="flex gap-3.5 px-4 py-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.05 }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" className="mt-0.5 shrink-0 text-ink" aria-hidden><g filter="url(#ink)">{k.icon}</g></svg>
              <div>
                <p className="text-[16px] font-semibold">{k.what}</p>
                <p className="mt-0.5 text-[14px] leading-snug text-ink-muted">{k.why}</p>
              </div>
            </motion.li>
          ))}
        </ul>

        <a className={buttonClass("secondary", "lg", "w-full")} href="/api/me/export" download>Download my data</a>
        {error && <Notice tone="danger">That didn&apos;t work. Try again?</Notice>}
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.div
              key="confirm"
              className="space-y-2 rounded-[24px] bg-surface p-4 shadow-card ring-1 ring-danger/30"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <p className="text-[17px] font-semibold">{shared ? "Delete what you added?" : "Delete everything?"}</p>
              <p className="text-[14px] leading-snug text-ink-muted">
                {shared
                  ? "This is a shared demo account, so its sample quests, crew and coins stay for the next person. Your location, photos and check-ins go for good."
                  : "Your routes, photos, check-ins, crews and connections go for good. This can't be undone."}
              </p>
              <Button variant="danger" size="lg" disabled={busy} onClick={remove}>{busy ? "Deleting…" : shared ? "Yes, delete it" : "Yes, delete it all"}</Button>
              <Button variant="quiet" size="lg" onClick={() => setConfirming(false)}>Keep my account</Button>
            </motion.div>
          ) : (
            <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button variant="danger" size="lg" onClick={() => setConfirming(true)}>Delete my data</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </Split>
    </AppShell>
  );
}
