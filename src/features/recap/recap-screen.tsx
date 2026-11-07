"use client";
import { motion, useReducedMotion } from "motion/react";
import { useParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import type { Recap } from "@/lib/contracts";
import { chime } from "@/lib/feedback";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { ButtonLink, MagneticButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { Odometer } from "@/components/ui/odometer";
import { MoodCheck } from "@/features/checkin/mood-check";
import { RecapExtras } from "./recap-extras";


// The walk you took, drawn as a line from the real route points. With no
// route (location off, or an anywhere quest) we draw nothing rather than fake one.
function routePath(route: Recap["route"]) {
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
  // Only after mount, and never with reduced motion, so hydration matches.
  const reduce = useReducedMotion();
  const moving = useSyncExternalStore(() => () => {}, () => true, () => false) && !reduce;
  // Opened from your quest history on the You page: go back there, and no chime.
  const fromMe = useSyncExternalStore(() => () => {}, () => new URLSearchParams(location.search).get("from") === "me", () => false);
  const back = fromMe ? "/me" : "/";

  useEffect(() => {
    const quiet = new URLSearchParams(location.search).get("from") === "me";
    api.recap(runId).then((r) => { setRecap(r); if (!quiet) chime(); }).catch(() => setError(true));
  }, [runId]);

  async function stayInTouch() {
    setKept("asked");
    const r = await api.connect(runId).catch(() => null);
    if (r?.connected) setKept("connected");
  }

  const name = recap?.partner?.display_name;
  const km = recap?.distance_m != null ? recap.distance_m / 1000 : null;

  return (
    <AppShell nav={false}>
      <Hero className="pb-8">
        <HeroBar left={<HeroIcon href={back} label={fromMe ? "Back" : "Done"} d={fromMe ? "M15 6l-6 6 6 6" : "M6 6l12 12M18 6L6 18"} />} center="recap" />
        <Hand as="h1" className="px-6 pt-1 text-center text-[40px] leading-none font-bold">
          {name ? `you and ${name} did it` : "you did it"}
        </Hand>
        <p className="mx-auto mt-2 max-w-[32ch] px-6 text-center text-[15px] leading-snug text-on-sky/85">
          {recap?.title ? recap.title.charAt(0).toUpperCase() + recap.title.slice(1) : " "}
        </p>

        {recap && recap.route.length >= 2 && (
        <svg viewBox="0 0 340 110" className="mx-auto mt-3 block w-full max-w-[360px] px-3" aria-hidden>
          {(
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
              {/* you, walking it again: a dot follows the real route once the
                  line has drawn, and stays where you finished */}
              {moving && (
                <circle r="5" fill="#fff" stroke="rgb(255 255 255 / .35)" strokeWidth="6" opacity="0">
                  <set attributeName="opacity" to="1" begin="2s" />
                  <animateMotion dur="2.6s" begin="2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.25 1" path={routePath(recap.route)} />
                </circle>
              )}
            </>
          )}
        </svg>
        )}

        <div className="mt-5 flex justify-center gap-10 px-4 text-center">
          {[
            { v: recap?.duration_min ?? 0, l: recap?.duration_min === 1 ? "minute" : "minutes" },
            ...(recap?.distance_m != null && recap.distance_m >= 50
              ? [km! >= 1 ? { v: km!.toFixed(1), l: "km walked" } : { v: Math.round(recap.distance_m / 10) * 10, l: "metres walked" }]
              : []),
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

        {recap && <RecapExtras recap={recap} />}

        {recap && <MoodCheck runId={runId} phase="after" />}

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
        <ButtonLink size="lg" variant="quiet" href={back}>{fromMe ? "Back to you" : "Back to today"}</ButtonLink>
      </div>
    </AppShell>
  );
}
