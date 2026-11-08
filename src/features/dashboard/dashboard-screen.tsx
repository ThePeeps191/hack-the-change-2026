"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Dashboard, User } from "@/lib/contracts";
import { setSound, soundOn } from "@/lib/feedback";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar } from "@/components/ui/hero";
import { SunArc } from "@/components/ui/sun-arc";
import { Odometer } from "@/components/ui/odometer";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { Entry, FaceCard, Weather, WeekStrip } from "./you-bits";
import { type Comfort, toComfort, toPrefs } from "@/features/onboarding/prefs";
import { ProfileLinks } from "./profile-links";

const defaults: Comfort = { pace: "walk", talk: "side", stepFree: false };

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
    api.me().then((u) => { setMe(u); setComfort(toComfort(u.prefs)); }).catch(() => {});
    api.dashboard().then(setD).catch(() => {});
    setSoundState(soundOn()); // eslint-disable-line react-hooks/set-state-in-effect -- read client-only storage after mount
  }, []);

  function update(patch: Partial<Comfort>) {
    const next = { ...comfort, ...patch };
    setComfort(next);
    api.updateMe({ prefs: toPrefs(next, me?.prefs.language) }).then(setMe).catch(() => {});
  }

  const active = d?.active_minutes_week ?? 0;
  const goal = d?.active_goal_minutes ?? 150;
  const faces = d?.familiar_faces ?? [];
  const mood = d?.mood;

  // The server can log one quest twice, once with no route (0 m). Show the
  // one with a route and drop the empty copy.
  const journal = (d?.history ?? []).filter(
    (h, _, all) => !(!h.distance_m && all.some((o) => o !== h && o.quest.id === h.quest.id && o.partner?.display_name === h.partner?.display_name && !!o.distance_m)),
  );

  return (
    <AppShell>
      <Hero className="pb-8">
        <HeroBar center="you" />
        <Hand as="h1" className="text-center text-[36px] leading-none font-bold">
          {me ? `hi, ${me.display_name.split(" ")[0].toLowerCase()}` : " "}
        </Hand>
        <SunArc caption={<span className="text-[13px] font-medium text-on-sky/95">of {goal} active min this week</span>} progress={active / goal} className="mt-3 px-5">
          <Odometer value={active} delay={150} className="numeral text-[80px] leading-none" />
        </SunArc>
        <p className="mx-auto mt-3 max-w-[32ch] px-6 text-center text-[15px] leading-snug text-balance text-on-sky/95">
          Canada&apos;s movement guidelines suggest {goal} a week.
        </p>
        {d && <WeekStrip history={d.history} />}
        {d && (
          <p className="mt-3 text-center text-[13px] font-medium text-on-sky/90">
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
                {faces.map((f, i) => <FaceCard key={f.display_name} face={f} i={i} wide={faces.length === 1} />)}
              </ul>
            )}
          </Section>
        )}

        {d && mood && mood.checkins > 0 && (
          <Section id="mood" title="after a quest">
            <div className="rounded-[24px] bg-surface p-4 shadow-card">
              <p className="text-[16px] leading-snug">
                You felt better after <span className="font-semibold">{mood.after_better} of {mood.checkins}</span> {mood.checkins === 1 ? "quest" : "quests"} you checked in on.
              </p>
              <div className="mt-3">
                <Weather better={mood.after_better} total={mood.checkins} />
              </div>
            </div>
          </Section>
        )}

        {journal.length > 0 && (
          <Section id="recent" title="recently">
            <ul className="rows overflow-hidden rounded-[24px] bg-surface shadow-card">
              {journal.map((h, i) => <Entry key={h.run_id} h={h} i={i} />)}
            </ul>
          </Section>
        )}

        <div id="comfort" className="scroll-mt-6">
          <Section id="comfort-title" title="how you like to meet" note="We use these to pick quests that suit you both. Saved to your account.">
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
        <ProfileLinks />
      </div>
    </AppShell>
  );
}
