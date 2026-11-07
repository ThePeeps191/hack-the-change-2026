"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Dashboard, User } from "@/lib/contracts";
import { setSound, soundOn } from "@/lib/feedback";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Skeleton } from "@/components/ui/card";
import { Arc, Hero, HeroBar } from "@/components/ui/hero";
import { Odometer } from "@/components/ui/odometer";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { EmptyStamp, Entry, FaceCard, Stamp, Weather, WeekStrip } from "./you-bits";

type Comfort = { pace: "stroll" | "walk" | "brisk"; talk: "side" | "chatty"; stepFree: boolean };
const COMFORT_KEY = "amble:comfort";
const defaults: Comfort = { pace: "walk", talk: "side", stepFree: false };

function BigRing({ value, goal }: { value: number; goal: number }) {
  return (
    <div className="relative grid size-[180px] place-items-center">
      <Arc progress={value / goal} size={180} stroke={8} color="#9cf2bf" />
      <div className="flex flex-col items-center">
        <Odometer value={value} delay={150} className="font-[family-name:var(--font-display)] text-[52px] leading-none font-semibold tracking-[-0.04em]" />
        <span className="mt-1 text-[13px] font-medium text-on-sky/85">of {goal} min</span>
      </div>
    </div>
  );
}

function Section({ id, title, children, note }: { id: string; title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <motion.section
      aria-labelledby={id}
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <Hand as="h2" className="mb-2.5 px-1 text-[26px] leading-none font-bold"><span id={id}>{title}</span></Hand>
      {children}
      {note && <p className="px-1 pt-2 text-[13px] leading-snug text-ink-faint">{note}</p>}
    </motion.section>
  );
}

export function DashboardScreen() {
  const [me, setMe] = useState<User | null>(null);
  const [d, setD] = useState<Dashboard | null>(null);
  const [comfort, setComfort] = useState<Comfort>(defaults);
  const [sound, setSoundState] = useState(true);

  useEffect(() => {
    api.me().then(setMe).catch(() => {});
    api.dashboard().then(setD).catch(() => {});
    try {
      const saved = localStorage.getItem(COMFORT_KEY);
      if (saved) setComfort({ ...defaults, ...JSON.parse(saved) }); // eslint-disable-line react-hooks/set-state-in-effect -- read client-only storage after mount
    } catch {}
    setSoundState(soundOn());
  }, []);

  function update(patch: Partial<Comfort>) {
    const next = { ...comfort, ...patch };
    setComfort(next);
    try {
      localStorage.setItem(COMFORT_KEY, JSON.stringify(next));
    } catch {}
  }

  const active = d?.active_minutes_week ?? 0;
  const goal = d?.active_goal_minutes ?? 150;
  const faces = d?.familiar_faces ?? [];
  const places = d?.new_places ?? [];
  const mood = d?.mood;

  return (
    <AppShell>
      <Hero className="pb-8">
        <HeroBar center="you" />
        <Hand as="h1" className="text-center text-[36px] leading-none font-bold">
          {me ? `hi, ${me.display_name.split(" ")[0].toLowerCase()}` : " "}
        </Hand>
        <div className="mt-4 flex justify-center">
          <BigRing value={active} goal={goal} />
        </div>
        <p className="mx-auto mt-3 max-w-[32ch] px-6 text-center text-[15px] leading-snug text-balance text-on-sky/85">
          Active minutes this week. Canada&apos;s guidelines suggest {goal}.
        </p>
        {d && <WeekStrip history={d.history} />}
        {d && (
          <p className="mt-3 text-center text-[13px] font-medium text-on-sky/75">
            {d.quests_done} quests · {d.km_moved} km · {d.people_met} people met
          </p>
        )}
      </Hero>

      <div className="space-y-8 px-4 pt-7">
        {!d && <Skeleton className="h-40 rounded-[24px]" />}

        {d && (
          <Section
            id="faces"
            title="familiar faces"
            note={faces.length > 0 ? "Casual friends usually take about 50 hours together. Every quest counts toward it." : undefined}
          >
            {faces.length === 0 ? (
              <p className="px-1 text-[15px] text-ink-muted">Do a second quest with someone and they&apos;ll show up here.</p>
            ) : (
              <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1">
                {faces.map((f, i) => <FaceCard key={f.display_name} face={f} i={i} />)}
              </ul>
            )}
          </Section>
        )}

        {d && (
          <Section id="places" title="new places" note={places.length > 0 ? `${places.length} stamp${places.length === 1 ? "" : "s"} this month. Quests take you somewhere new on purpose.` : undefined}>
            <ul className="grid grid-cols-3 gap-3 rounded-[24px] bg-surface p-4 shadow-card">
              {places.map((p, i) => <Stamp key={p.name} name={p.name} date={p.first_visit} i={i} />)}
              <EmptyStamp />
            </ul>
          </Section>
        )}

        {d && mood && mood.checkins > 0 && (
          <Section id="mood" title="after a quest">
            <div className="rounded-[24px] bg-surface p-4 shadow-card">
              <p className="text-[16px] leading-snug">
                You felt better after <span className="font-semibold">{mood.after_better} of {mood.checkins}</span> quests you checked in on.
              </p>
              <div className="mt-3">
                <Weather better={mood.after_better} total={mood.checkins} />
              </div>
            </div>
          </Section>
        )}

        {d && d.history.length > 0 && (
          <Section id="recent" title="recently">
            <ul className="rows overflow-hidden rounded-[24px] bg-surface shadow-card">
              {d.history.map((h, i) => <Entry key={h.run_id} h={h} i={i} />)}
            </ul>
          </Section>
        )}

        <div id="comfort" className="scroll-mt-6">
          <Section id="comfort-title" title="how you like to meet" note="We use these to pick quests and partners that suit you. Saved on this phone.">
            <div className="space-y-4 rounded-[24px] bg-surface p-4 shadow-card">
              <div>
                <p className="mb-2 px-1 text-[14px] font-medium text-ink-muted">Pace</p>
                <Segmented
                  label="Pace"
                  value={comfort.pace}
                  onChange={(pace) => update({ pace })}
                  options={[
                    { value: "stroll", label: "Easy stroll" },
                    { value: "walk", label: "Walk" },
                    { value: "brisk", label: "Brisk" },
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 px-1 text-[14px] font-medium text-ink-muted">Talking</p>
                <Segmented
                  label="Talking"
                  value={comfort.talk}
                  onChange={(talk) => update({ talk })}
                  options={[
                    { value: "side", label: "Side by side" },
                    { value: "chatty", label: "Happy to chat" },
                  ]}
                />
              </div>
            </div>
            <div className="rows mt-2.5 overflow-hidden rounded-[24px] bg-surface shadow-card">
              <Switch checked={comfort.stepFree} onChange={(stepFree) => update({ stepFree })} label="Step-free places only" hint="No stairs or steep paths on the way." />
              <Switch
                checked={sound}
                onChange={(on) => {
                  setSound(on);
                  setSoundState(on);
                }}
                label="Sounds and taps"
                hint="Quiet clicks and chimes when things happen."
              />
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
