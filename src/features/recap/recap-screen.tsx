"use client";
import { AnimatePresence, motion } from "motion/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Recap } from "@/lib/contracts";
import { chime } from "@/lib/feedback";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { ButtonLink, MagneticButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { Odometer } from "@/components/ui/odometer";
import { Segmented } from "@/components/ui/segmented";

type Feel = "better" | "same" | "worse";

// The walk you took, drawn as a line. With a real route we project the points;
// without one we draw a gentle made-up wander so the moment still lands.
function routePath(route: Recap["route"]) {
  if (route.length < 2) return "M14 92 C 60 88, 70 40, 120 52 S 190 96, 236 70 S 300 20, 326 34";
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const sx = (v: number) => 14 + ((v - minLng) / (maxLng - minLng || 1)) * 312;
  const sy = (v: number) => 100 - ((v - minLat) / (maxLat - minLat || 1)) * 80;
  return route.map((p, i) => `${i ? "L" : "M"}${sx(p.lng).toFixed(1)} ${sy(p.lat).toFixed(1)}`).join(" ");
}

export function RecapScreen() {
  const { runId } = useParams<{ runId: string }>();
  const [recap, setRecap] = useState<Recap | null>(null);
  const [error, setError] = useState(false);
  const [kept, setKept] = useState<null | "asked" | "connected">(null);
  const [feel, setFeel] = useState<Feel | "">("");

  useEffect(() => {
    api.recap(runId).then((r) => { setRecap(r); chime(); }).catch(() => setError(true));
  }, [runId]);

  async function stayInTouch() {
    setKept("asked");
    const r = await api.connect(runId).catch(() => null);
    if (r?.connected) setKept("connected");
  }

  function pickFeel(v: Feel | "") {
    setFeel(v);
    try {
      localStorage.setItem(`amble:feel:${runId}`, v);
    } catch {}
  }

  const name = recap?.partner?.display_name;
  const km = recap?.distance_m != null ? recap.distance_m / 1000 : null;

  return (
    <AppShell nav={false}>
      <Hero className="pb-8">
        <HeroBar left={<HeroIcon href="/" label="Done" d="M6 6l12 12M18 6L6 18" />} center="recap" />
        <Hand as="h1" className="px-6 pt-1 text-center text-[40px] leading-none font-bold">
          {name ? `you and ${name} did it` : "you did it"}
        </Hand>
        <p className="mx-auto mt-2 max-w-[32ch] px-6 text-center text-[15px] leading-snug text-on-sky/85">
          {recap?.title ? recap.title.charAt(0).toUpperCase() + recap.title.slice(1) : " "}
        </p>

        <svg viewBox="0 0 340 110" className="mx-auto mt-3 block w-full max-w-[360px] px-3" aria-hidden>
          {recap && (
            <>
              <path d={routePath(recap.route)} fill="none" stroke="rgb(255 255 255 / .25)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d={routePath(recap.route)}
                fill="none"
                stroke="#fff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1"
                style={{ ["--len" as string]: 1, animation: "draw 1.8s var(--ease-out-soft) .2s both" }}
              />
              <circle cx="14" cy="92" r="6" fill="#fff" opacity=".9" />
            </>
          )}
        </svg>

        <div className="mt-2 grid grid-cols-3 px-4 text-center">
          {[
            { v: recap?.duration_min ?? 0, l: "minutes" },
            { v: km != null ? km.toFixed(1) : "0.0", l: "km walked" },
            { v: recap?.coins ?? 0, l: "coins" },
          ].map((s, i) => (
            <div key={s.l}>
              <Odometer value={s.v} delay={300 + i * 120} className="font-[family-name:var(--font-display)] text-[32px] font-semibold tracking-[-0.02em]" />
              <p className="mt-0.5 text-[13px] font-medium text-on-sky/85">{s.l}</p>
            </div>
          ))}
        </div>
      </Hero>

      <div className="flex-1 space-y-6 px-4 pt-6">
        {error && <Notice tone="warning">The recap is still being written. Check back in a minute.</Notice>}
        {!recap && !error && <Skeleton className="h-28 rounded-[24px]" />}

        {recap && (
          <motion.p
            className="px-1 text-[17px] leading-relaxed text-pretty"
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {recap.summary}
          </motion.p>
        )}

        {recap && (
          <section aria-labelledby="feel">
            <Hand as="h2" className="mb-2.5 px-1 text-[26px] leading-none font-bold">
              <span id="feel">how do you feel?</span>
            </Hand>
            <Segmented<Feel | "">
              label="How you feel after the quest"
              value={feel}
              onChange={pickFeel}
              options={[
                { value: "better", label: "Better" },
                { value: "same", label: "About the same" },
                { value: "worse", label: "Worse" },
              ]}
            />
            <AnimatePresence>
              {feel && (
                <motion.p
                  className="px-1 pt-2 text-[14px] text-ink-muted"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {feel === "better" ? "Noted. That's what this is for." : feel === "same" ? "Noted. Some days are like that." : "Thanks for being honest. Next time we'll keep it lighter."}
                </motion.p>
              )}
            </AnimatePresence>
          </section>
        )}

        {recap && name && (
          <section className="rounded-[24px] bg-surface p-5 shadow-card">
            <p className="text-[17px] font-semibold">Stay in touch with {name}?</p>
            <p className="mt-1 text-[14px] leading-snug text-ink-muted">You&apos;ll only connect if you both say yes. Next time you&apos;re both free, you can do another one together.</p>
            <div className="mt-4">
              {kept === "connected" ? (
                <p className="flex min-h-14 items-center justify-center gap-2 text-[16px] font-semibold text-success">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  You&apos;re connected with {name}
                </p>
              ) : (
                <MagneticButton onClick={stayInTouch} disabled={kept !== null}>
                  {kept === "asked" ? "Asked…" : `Yes, add ${name}`}
                </MagneticButton>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="px-4 pt-6 pb-6">
        <ButtonLink size="lg" variant="quiet" href="/">Back to today</ButtonLink>
      </div>
    </AppShell>
  );
}
