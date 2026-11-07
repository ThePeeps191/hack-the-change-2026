"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { QUEST_MINUTES } from "@/lib/config";
import type { Dashboard, Quest } from "@/lib/contracts";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { MagneticButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Hero, HeroBar, HeroIcon, icons, Ring, RoundButton } from "@/components/ui/hero";
import { useGoFree } from "@/features/matching/use-go-free";
import { QuestCard } from "@/features/quests/quest-card";

function today() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toLowerCase();
}

export function HomeScreen() {
  const { go, busy, error } = useGoFree();
  const [d, setD] = useState<Dashboard | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [more, setMore] = useState(false);
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(today()); // eslint-disable-line react-hooks/set-state-in-effect -- client-only date avoids a hydration mismatch
    api.dashboard().then(setD).catch(() => {});
    api.quests().then(setQuests).catch(() => setQuests([]));
  }, []);

  const nearby = (quests ?? []).filter((q) => q.type !== "anywhere");
  const shown = more ? nearby : nearby.slice(0, 3);
  const active = d?.active_minutes_week ?? 0;
  const goal = d?.active_goal_minutes ?? 150;

  return (
    <AppShell>
      <Hero>
        <HeroBar
          left={<HeroIcon href="/me#comfort" label="Comfort settings" d={icons.settings} />}
          center={date}
          right={<HeroIcon href="/map" label="Map" d={icons.map} />}
        />
        <div className="mt-2 flex justify-center gap-3 px-4">
          <Ring value={d ? active : 0} label="active min" progress={active / goal} color="#8ff0b4" />
          <Ring value={d?.familiar_faces?.length ?? 0} label="familiar faces" progress={(d?.familiar_faces?.length ?? 0) / 5} color="#ffffff" />
          <Ring value={d?.new_places?.length ?? 0} label="new places" progress={(d?.new_places?.length ?? 0) / 8} color="#ffbe7a" />
        </div>
        <Hand as="h1" className="mt-5 text-center text-[38px] leading-none font-bold">free for {QUEST_MINUTES} min?</Hand>
        <p className="mx-auto mt-2 max-w-[30ch] text-center text-[15px] leading-snug text-on-sky/85">
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

      {error && <div className="pt-3"><Notice tone="danger">{error}</Notice></div>}

      <section className="px-4 pt-6" aria-labelledby="nearby">
        <Hand as="h2" className="mb-3 px-1 text-[28px] leading-none font-bold text-ink">
          <span id="nearby">nearby</span>
        </Hand>
        <div className="flex flex-col gap-2.5">
          {quests === null
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded-[20px]" />)
            : shown.length === 0
              ? <p className="px-1 text-[15px] text-ink-muted">Nothing mapped near you yet. Say you&apos;re free and Gemini will write a quest for where you are.</p>
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
                      <QuestCard quest={q} />
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
    </AppShell>
  );
}
