"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Dashboard, User } from "@/lib/contracts";
import { setSound, soundOn } from "@/lib/feedback";
import { distance, shortDate } from "@/lib/format";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Skeleton } from "@/components/ui/card";
import { Arc, Hero, HeroBar } from "@/components/ui/hero";
import { Odometer } from "@/components/ui/odometer";
import { QuestIcon } from "@/components/ui/quest-icon";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";

type Comfort = { pace: "stroll" | "walk" | "brisk"; talk: "side" | "chatty"; stepFree: boolean };
const COMFORT_KEY = "amble:comfort";
const defaults: Comfort = { pace: "walk", talk: "side", stepFree: false };

// Roughly 50 hours together turns an acquaintance into a casual friend (Hall, 2019).
const FRIEND_MINUTES = 50 * 60;

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
        <p className="mx-auto mt-3 max-w-[30ch] px-6 text-center text-[15px] leading-snug text-on-sky/85">
          Active minutes this week. Canada&apos;s guidelines suggest {goal}.
        </p>
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
              <ul className="rows overflow-hidden rounded-[24px] bg-surface shadow-card">
                {faces.map((f) => (
                  <li key={f.display_name} className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent-strong">{f.display_name[0]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[16px] font-medium">{f.display_name}</p>
                        <p className="text-[13px] text-ink-muted">
                          {f.quests_together} quests · {f.minutes_together} min together
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 ml-[52px] h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(3, (f.minutes_together / FRIEND_MINUTES) * 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {d && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[24px] bg-surface p-4 shadow-card">
              <Odometer value={places.length} className="font-[family-name:var(--font-display)] text-[40px] leading-none font-semibold tracking-[-0.03em]" />
              <p className="mt-1.5 text-[14px] font-medium text-ink-muted">new places this month</p>
            </div>
            <div className="rounded-[24px] bg-surface p-4 shadow-card">
              <div className="flex items-baseline gap-1 font-[family-name:var(--font-display)]">
                <Odometer value={mood?.after_better ?? 0} className="text-[40px] leading-none font-semibold tracking-[-0.03em]" />
                <span className="text-[17px] font-medium text-ink-faint">/{mood?.checkins ?? 0}</span>
              </div>
              <p className="mt-1.5 text-[14px] font-medium text-ink-muted">times you felt better after</p>
            </div>
          </div>
        )}

        {places.length > 0 && (
          <Section id="places" title="new places">
            <ul className="rows overflow-hidden rounded-[24px] bg-surface shadow-card">
              {places.map((p) => (
                <li key={p.name} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="size-2 shrink-0 rounded-full bg-local" />
                  <span className="flex-1 text-[16px] font-medium">{p.name}</span>
                  <span className="text-[13px] text-ink-faint">{shortDate(p.first_visit)}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {d && d.history.length > 0 && (
          <Section id="recent" title="recently">
            <ul className="rows overflow-hidden rounded-[24px] bg-surface shadow-card">
              {d.history.map((h) => (
                <li key={h.run_id} className="flex items-center gap-3 px-4 py-3.5">
                  <QuestIcon type={h.quest.type} size={8} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">{h.quest.title.charAt(0).toUpperCase() + h.quest.title.slice(1)}</p>
                    <p className="truncate text-[13px] text-ink-muted">
                      {shortDate(h.completed_at)} · {h.partner ? `with ${h.partner.display_name}` : "solo"} · {distance(h.distance_m)}
                    </p>
                  </div>
                  <span className="text-[14px] font-semibold tabular-nums">+{h.coins}</span>
                </li>
              ))}
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
