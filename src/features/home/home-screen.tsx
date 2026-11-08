"use client";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CAMPUS_CENTER, QUEST_MINUTES } from "@/lib/config";
import { getPosition } from "@/lib/geo";
import type { Dashboard, Quest } from "@/lib/contracts";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { Split } from "@/components/ui/split";
import { MagneticButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar, icons, RoundButton } from "@/components/ui/hero";
import { Odometer } from "@/components/ui/odometer";
import { SunArc } from "@/components/ui/sun-arc";
import { useGoFree } from "@/features/matching/use-go-free";
import { GlyphTile, QuestCard } from "@/features/quests/quest-card";
import { Carousel } from "@/components/ui/carousel";
import { Coin } from "@/components/ui/quest-glyph";
import { InviteCard } from "@/features/invites/invite-card";
import { ResumeBanner } from "./resume-banner";
import { QuestSheet } from "@/features/quests/quest-sheet";

function today() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toLowerCase();
}

export function HomeScreen() {
  const router = useRouter();
  const { go, busy, error } = useGoFree();
  const [d, setD] = useState<Dashboard | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [more, setMore] = useState(false);
  const [date, setDate] = useState("");
  const [open, setOpen] = useState<Quest | null>(null);
  const [crewId, setCrewId] = useState<string | undefined>();
  const [here, setHere] = useState<{ lat: number; lng: number }>(CAMPUS_CENTER);

  useEffect(() => {
    setDate(today()); // eslint-disable-line react-hooks/set-state-in-effect -- client-only date avoids a hydration mismatch
    api.dashboard().then(setD).catch(() => {});
    api.quests().then(setQuests).catch(() => setQuests([]));
    api.crews().then((c) => setCrewId(c[0]?.id)).catch(() => {});
    api.me().then((u) => { if (!u.age_confirmed_at) router.replace("/welcome"); }).catch(() => {});
    // Sort "nearby" from where you are, but only if location is already allowed:
    // the home screen never pops a permission prompt. Otherwise sort from campus.
    navigator.permissions?.query({ name: "geolocation" }).then((p) => {
      if (p.state === "granted") getPosition().then((pos) => { if (!pos.approximate) setHere(pos); });
    }).catch(() => {});
  }, [router]);

  const away = (q: Quest) => (q.lat == null || q.lng == null ? Infinity : (q.lat - here.lat) ** 2 + ((q.lng - here.lng) * Math.cos((here.lat * Math.PI) / 180)) ** 2);
  const nearby = (quests ?? []).filter((q) => q.type !== "anywhere").sort((a, b) => away(a) - away(b));
  const shown = more ? nearby : nearby.slice(0, 3);
  const anywhere = (quests ?? []).filter((q) => q.type === "anywhere");
  const active = d?.active_minutes_week ?? 0;
  const goal = d?.active_goal_minutes ?? 150;
  const faces = d?.familiar_faces?.length ?? 0;
  const places = d?.new_places?.length ?? 0;

  return (
    <AppShell>
      <Split aside={
      <Hero>
        <HeroBar center={date} />
        <SunArc caption={<span className="text-[13px] font-medium text-on-sky/90">of {goal} active min this week</span>} progress={active / goal} className="mt-1 px-6">
          <Odometer value={d ? active : 0} className="numeral text-[80px] leading-none" />
        </SunArc>
        <p className="mt-2.5 flex items-center justify-center gap-2 text-[14px] font-medium text-on-sky/90">
          <span><span className="font-semibold tabular-nums text-on-sky">{faces}</span> {faces === 1 ? "familiar face" : "familiar faces"}</span>
          <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden className="opacity-60"><circle cx="3" cy="3" r="1.5" fill="currentColor" /></svg>
          <span><span className="font-semibold tabular-nums text-on-sky">{places}</span> {places === 1 ? "new place" : "new places"}</span>
        </p>
        <Hand as="h1" className="mt-5 text-center text-[38px] leading-none font-bold">free for {QUEST_MINUTES} min?</Hand>
        <p className="mx-auto mt-2 max-w-[30ch] text-center text-[15px] leading-snug text-on-sky/95">
          Someone nearby is too. You&apos;ll get one small thing to do together.
        </p>
        <div className="mt-5 flex items-center gap-3 px-5">
          <RoundButton href="/me#comfort" label="How you like to meet" d={icons.sliders} />
          <MagneticButton variant="onSky" onClick={go} disabled={busy}>
            {busy ? "Finding your spot…" : "I'm free"}
          </MagneticButton>
          <RoundButton href="/me" label="Your week" d={icons.history} />
        </div>
      </Hero>
      }>

      {error && <div className="pt-3"><Notice tone="danger">{error}</Notice></div>}
      <ResumeBanner />

      <section className="px-4 pt-6 lg:pt-0" aria-labelledby="nearby">
        <Hand as="h2" className="mb-3 px-1 text-[28px] leading-none font-bold text-ink">
          <span id="nearby">nearby</span>
        </Hand>
        <div className="flex flex-col gap-2.5">
          {quests === null
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded-[20px]" />)
            : shown.length === 0
              ? <p className="px-1 text-[15px] text-ink-muted">Nothing mapped near you yet.</p>
              : (
                <AnimatePresence initial={false}>
                  {shown.map((q, i) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <QuestCard quest={q} onClick={() => setOpen(q)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
        </div>
        {nearby.length > 3 && (
          <button onClick={() => setMore((m) => !m)} className="mx-auto mt-3 flex min-h-11 items-center gap-1 px-4 text-[14px] font-medium text-ink-faint hover:text-ink-muted">
            {more ? "show less" : `+${nearby.length - 3} more`}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className={more ? "rotate-180" : ""}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </section>

      {anywhere.length > 0 && (
        <section className="pt-6" aria-labelledby="anywhere">
          <div className="px-5">
            <Hand as="h2" className="text-[28px] leading-none font-bold text-ink"><span id="anywhere">anywhere</span></Hand>
            <p className="mt-1 text-[14px] text-ink-muted">Short ones to do on your own or with your crew.</p>
          </div>
          <div className="mt-3">
            <Carousel
              label="Anywhere quests"
              items={anywhere.map((q) => ({
                key: q.id,
                node: (
                  <button
                    type="button"
                    onClick={() => setOpen(q)}
                    className="flex h-full w-full flex-col rounded-[24px] bg-surface p-4 text-left shadow-card ring-1 ring-[var(--hairline)] active:scale-[0.98]"
                  >
                    <span className="flex items-center justify-between">
                      <GlyphTile quest={q} size={40} />
                      <span className="flex items-center gap-1 text-[14px] font-semibold tabular-nums"><Coin size={14} />{q.coins}</span>
                    </span>
                    <span className="font-semibold mt-5 text-[20px] leading-[1.15] text-pretty">{q.title.charAt(0).toUpperCase() + q.title.slice(1)}</span>
                    <span className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-muted">{q.description}</span>
                    <span className="mt-auto pt-3 text-[13px] font-medium text-ink-faint">{q.duration_min} min · {q.proof === "gps" ? "your route is the proof" : `${q.proof} proof`}</span>
                  </button>
                ),
              }))}
            />
          </div>
        </section>
      )}

      <InviteCard />
      </Split>
      <QuestSheet quest={open} crewId={crewId} onClose={() => setOpen(null)} />
    </AppShell>
  );
}
