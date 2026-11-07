"use client";
import Link from "next/link";
import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";
import type { Impact } from "@/lib/contracts";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon, Stars, dusk } from "@/components/ui/hero";
import { Odometer } from "@/components/ui/odometer";

// The page we show judges: what Amble has added up to, from the real tables.
// Every number comes from GET /api/impact's server function (src/server/impact.ts).
// Read top to bottom, the page goes from daylight to dusk.

const WEEKLY_GUIDELINE_MIN = 150; // Canadian 24-Hour Movement Guidelines
const METRICS_DOC = "https://github.com/ThePeeps191/hack-the-change-2026/blob/main/docs/METRICS.md";
const fmt = (n: number) => n.toLocaleString("en-CA");

// The shared rolling digits, or a plain number when the person prefers reduced
// motion (the Odometer blurs its digits for a moment even then).
// Done in CSS (motion-reduce:), so the server and the phone render the same.
// className is for type only; Count owns the display, so only one ever shows.
function Count({ value, delay = 0, className }: { value: number | string; delay?: number; className: string }) {
  return (
    <>
      <span className="motion-reduce:hidden"><Odometer value={value} delay={delay} className={className} /></span>
      <span className={`hidden tabular-nums motion-reduce:inline-block ${className}`}>{value}</span>
    </>
  );
}

// A number set inline in a sentence, in the display face.
function Num({ value, delay = 0 }: { value: number | string; delay?: number }) {
  return <Count value={value} delay={delay} className="mx-0.5 align-[-0.08em] leading-none font-[family-name:var(--font-display)] text-[1.5em] font-semibold tracking-[-0.03em] text-ink" />;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <motion.section
      aria-labelledby={id}
      className="px-6"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <Hand as="h2" className="mb-3 text-[28px] leading-none font-bold"><span id={id}>{title}</span></Hand>
      {children}
    </motion.section>
  );
}

function DemoLabel() {
  return <span className="inline-block shrink-0 rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold tracking-wide text-ink [text-shadow:none]">demo data</span>;
}

export function ImpactScreen({ impact }: { impact: Impact | null }) {
  return (
    <MotionConfig reducedMotion="user">
      <AppShell nav={false}>
        <Hero className="pb-9">
          <HeroBar left={<HeroIcon href="/" label="Open Amble" d="M14.5 5.5L8 12l6.5 6.5" />} center="amble" />
          {/* A deeper patch of sky behind the words, so white text keeps 3:1
              contrast where the sky fades to pale blue. All of it is large text. */}
          <div className="relative">
            <div aria-hidden className="pointer-events-none absolute -inset-x-16 -top-8 -bottom-20 bg-[radial-gradient(closest-side,var(--color-sky-top)_72%,transparent)]" />
            <div className="relative">
              <Hand as="h1" className="px-6 pt-1 text-center text-[40px] leading-none font-bold">time outside, together</Hand>
              {impact ? <SkyNumbers impact={impact} /> : (
                <p className="mx-auto mt-4 max-w-[24ch] px-6 text-center text-[19px] leading-snug font-bold">
                  The numbers didn&apos;t load just now. Give it a moment and try again.
                </p>
              )}
            </div>
          </div>
        </Hero>

        {impact ? <Body impact={impact} /> : (
          <div className="px-6 pt-8">
            <ButtonLink href="/impact" variant="secondary" size="lg" className="w-full">Try again</ButtonLink>
          </div>
        )}
      </AppShell>
    </MotionConfig>
  );
}

function SkyNumbers({ impact }: { impact: Impact }) {
  return (
    <div className="mt-5 px-6 text-center">
      <div className="flex flex-col items-center">
        {impact.source === "demo" && <DemoLabel />}
        <div className="mt-3">
          <Count value={fmt(impact.minutes_outside)} delay={150} className="font-[family-name:var(--font-display)] text-[64px] leading-none font-semibold tracking-[-0.04em]" />
        </div>
        <p className="mt-2 max-w-[24ch] text-[19px] leading-snug font-bold text-balance">minutes outside, added up across everyone</p>
      </div>
    </div>
  );
}

function Body({ impact }: { impact: Impact }) {
  const met = impact.people_met_someone_new;
  const pairs = impact.familiar_pairs;
  const weeks = Math.round((impact.minutes_outside / WEEKLY_GUIDELINE_MIN) * 10) / 10;
  return (
    <div className="flex flex-1 flex-col gap-10 pt-7 pb-10">
      <p className="px-6 text-[17px] leading-relaxed">
        {impact.quests_completed === 0
          ? "No quests finished yet. The first one starts the count."
          : `${fmt(impact.quests_completed)} ${impact.quests_completed === 1 ? "quest" : "quests"} finished and ${impact.km_walked} km on foot. Added up, that's ${weeks} ${weeks === 1 ? "week" : "weeks"} of the 150 active minutes Canada's guidelines suggest for one adult.`}
      </p>
      <Section id="met" title="people met">
        <p className="text-[18px] leading-relaxed">
          <Num value={fmt(met)} delay={250} /> {met === 1 ? "person has" : "people have"} met someone new on a quest.
        </p>
        <p className="mt-3 text-[18px] leading-relaxed">
          {pairs > 0 ? (
            <>
              <Num value={fmt(pairs)} delay={350} /> {pairs === 1 ? "pair has" : "pairs have"} met again, twice or more.
            </>
          ) : (
            "No pair has met twice yet. It's the number we'd watch most in a pilot."
          )}
        </p>
        <p className="mt-3 text-[14px] leading-snug text-ink-muted">
          Meeting again is how strangers become familiar faces. Hall (2019) estimates about 50 hours together to go from acquaintance to casual friend.
        </p>
      </Section>

      <Felt impact={impact} />

      <Section id="count" title="how we count">
        <ul className="space-y-2.5 text-[15px] leading-snug text-ink-muted">
          <li>Only finished quests count. Minutes run from start to finish, for each person on the quest.</li>
          <li>Practice runs with Priya, our bot partner, never count as meeting someone.</li>
          <li>
            {impact.source === "demo"
              ? "No real person has finished a quest yet, so these numbers come from our made-up demo accounts. They switch to real ones by themselves once people play."
              : "Real accounts only. The made-up demo people and the demo login are left out."}
          </li>
          <li>
            Totals only: no names, no places, nothing about one person. More on that in{" "}
            <Link href="/privacy" className="font-semibold text-ink underline">your data</Link>.
          </li>
        </ul>
        <a href={METRICS_DOC} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center text-[15px] font-semibold text-accent underline">
          What we&apos;d measure in a pilot
        </a>
      </Section>
    </div>
  );
}

// The dusk band: how people felt after their quests.
function Felt({ impact }: { impact: Impact }) {
  const pct = impact.felt_better_pct;
  return (
    <motion.section
      aria-labelledby="felt"
      className="relative mx-3 overflow-hidden rounded-[32px] px-6 pt-7 pb-8 text-on-sky"
      style={{ background: dusk }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Stars />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <Hand as="h2" className="text-[28px] leading-none font-bold"><span id="felt">how people felt</span></Hand>
          {impact.source === "demo" && <DemoLabel />}
        </div>
        {pct == null ? (
          <p className="mt-4 text-[17px] leading-relaxed text-on-sky/95">
            Nobody has checked in after a quest yet. It&apos;s one optional tap at the end of a quest.
          </p>
        ) : (
          <>
            <div className="mt-5"><Count value={`${pct}%`} delay={200} className="font-[family-name:var(--font-display)] text-[56px] leading-none font-semibold tracking-[-0.04em]" /></div>
            <p className="mt-2 text-[17px] leading-snug text-on-sky/95">of after-quest check-ins said they felt good or better.</p>
            <p className="mt-3 text-[14px] leading-snug text-on-sky/80">
              From {fmt(impact.checkins_after)} one-tap {impact.checkins_after === 1 ? "check-in" : "check-ins"}. Each person only ever sees their own; this is the total.
            </p>
          </>
        )}
      </div>
    </motion.section>
  );
}
