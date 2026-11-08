"use client";
import { Liquid } from "liquid-gooey";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { chime, knock } from "@/lib/feedback";
import { distance, walkMinutes } from "@/lib/format";
import type { QuestRun } from "@/lib/contracts";
import { usePoll } from "@/lib/use-poll";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { Toast, toastPill, toastQuiet } from "@/components/ui/toast";
import { Burst, Elapsed, PlaceTicker, Specks } from "./match-bits";
import { CategoryIcon, categoryOf, Coin } from "@/components/ui/quest-glyph";

type State = "searching" | "found" | "waiting" | "matched" | "ended";

// How far apart the two of you are drawn, per state. At "matched" the shapes
// overlap and the goo merges them into one.
const gap: Record<State, number> = { searching: 150, found: 120, waiting: 74, matched: 58, ended: 150 };

// The cloud. Your half (a small bump, a big crowned puff that says "you",
// half a flat base) and their half (a puff, a small bump, the other half of
// the base) each make a little cloud on their own. As the match comes
// together they slide in and the gooey filter fuses them into one big cloud:
// flat underneath, scalloped on top. Offsets are from each half's centre.
// [width, height, x, y]
type Puff = [number, number, number, number];
const HALF_YOU: Puff[] = [[150, 72, -21, 36], [84, 84, -59, 14]];
const HALF_THEM: Puff[] = [[150, 72, 21, 36], [72, 72, 71, 22]];
const CROWN_YOU: Puff = [116, 116, -1, -18];
const CROWN_THEM: Puff = [100, 100, 15, -12];
const BOX = { w: 360, h: 220 };
// Glass cloud: a translucent fill, a bright rim and highlight along the top,
// a cool shade on the underside, and a soft drop shadow, all drawn on the
// merged shape (so it reads as one body of cloud, not separate circles).
const GLASS =
  "inset 0 1.5px 0 rgba(255,255,255,.95), inset 0 14px 24px rgba(255,255,255,.85), inset 0 -20px 30px rgba(70,105,180,.34), inset 0 0 0 1px rgba(255,255,255,.55), 0 18px 40px rgba(13,40,90,.22)";
// Each bump also gets its own soft light from the upper left, fading out
// before its edge, so the top of the cloud looks billowed.
const BILLOW = "radial-gradient(circle at 42% 32%, rgb(255 255 255 / .8), rgb(255 255 255 / .25) 38%, transparent 64%)";

export function MatchScreen() {
  const router = useRouter();
  const approx = useSearchParams().get("approx") === "1";
  const [acting, setActing] = useState(false);
  const { data: match, error } = usePoll(api.match, {
    ms: 1500,
    until: (m) => m != null && m.status !== "pending" && (m.status !== "accepted" || m.run_id != null),
  });

  const state: State =
    match == null ? "searching" : match.status === "accepted" ? "matched" : match.status === "pending" ? (match.you_accepted ? "waiting" : "found") : "ended";

  // Once matched, fetch the quest so the screen can show what you're about to do.
  const [run, setRun] = useState<QuestRun | null>(null);
  const runId = match?.run_id ?? null;
  useEffect(() => {
    if (!runId) return;
    api.run(runId).then(setRun).catch(() => {});
  }, [runId]);

  const prev = useRef<State>("searching");
  useEffect(() => {
    if (state !== prev.current) {
      if (state === "found" || state === "matched") chime();
      if (state === "ended") knock();
      prev.current = state;
    }
  }, [state]);

  async function cancel() {
    setActing(true);
    await api.clearFree().catch(() => {});
    router.push("/");
  }

  async function respond(accept: boolean) {
    if (!match) return;
    setActing(true);
    try {
      if (accept) await api.acceptMatch(match.id);
      else {
        await api.declineMatch(match.id);
        router.push("/");
      }
    } finally {
      setActing(false);
    }
  }

  const name = match?.partner?.display_name;
  // True when the partner is the demo bot. Optional in the contract, so we say
  // so plainly instead of letting a practice partner pass for a real person.
  const practice = (match as (typeof match & { demo_partner?: boolean }) | null)?.demo_partner === true;
  const d = gap[state];
  const alone = state === "searching" || state === "ended";
  const you = alone ? 0 : -d / 2;
  const them = d / 2;
  // a puff's box, centred in the cloud's frame; x and y then move it
  const puff = (w: number, h: number) => ({ width: w, height: h, left: (BOX.w - w) / 2, top: (BOX.h - h) / 2 });

  return (
    <AppShell nav={false}>
      <Hero fill className="min-h-dvh">
        <HeroBar
          left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />}
          center={state === "matched" ? "matched" : state === "found" ? "someone nearby" : "finding someone"}
        />
        <motion.div
          className="relative mx-auto mt-4 grid h-[250px] w-full place-items-center"
          animate={state === "matched" ? { y: 0 } : { y: [0, -7, 0] }}
          transition={state === "matched" ? { duration: 0.4 } : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Specks gather={state === "matched"} />
          {state === "matched" && <Burst />}
          {state === "searching" && (
            <>
              <span className="absolute size-24 rounded-full border-2 border-white/50 animate-[ripple_2.6s_ease-out_infinite]" />
              <span className="absolute size-24 rounded-full border-2 border-white/50 animate-[ripple_2.6s_ease-out_1.3s_infinite]" />
            </>
          )}
          <Liquid
            fill="rgb(255 255 255 / .7)"
            blur={7}
            contrast={24}
            waviness={2.5}
            wavinessFreq={0.012}
            shadow={GLASS}
            className="h-[220px] w-[360px]"
          >
            {HALF_YOU.map(([w, h, dx, dy], i) => (
              <Liquid.Item key={`y${i}`} x={you + dx} y={dy} transition="bouncy" delay={40 * i} className="absolute" style={puff(w, h)}>
                <div className="size-full rounded-full" style={{ background: BILLOW }} />
              </Liquid.Item>
            ))}
            {HALF_THEM.map(([w, h, dx, dy], i) => (
              <Liquid.Item key={`t${i}`} x={them + dx} y={dy} scale={alone ? 0.001 : 1} transition="bouncy" delay={120 + 40 * i} className="absolute" style={puff(w, h)}>
                <div className="size-full rounded-full" style={{ background: BILLOW }} />
              </Liquid.Item>
            ))}
            <Liquid.Item x={you + CROWN_YOU[2]} y={CROWN_YOU[3]} transition="bouncy" className="absolute" style={puff(CROWN_YOU[0], CROWN_YOU[1])}>
              <div className="grid size-full place-items-center rounded-full pt-4 text-[18px] font-semibold text-[#173f86] [text-shadow:none]" style={{ background: BILLOW }}>{state === "matched" ? "" : "you"}</div>
            </Liquid.Item>
            <Liquid.Item x={them + CROWN_THEM[2]} y={CROWN_THEM[3]} scale={alone ? 0.001 : 1} transition="bouncy" delay={80} className="absolute" style={puff(CROWN_THEM[0], CROWN_THEM[1])}>
              <div className="grid size-full place-items-center rounded-full pt-4 text-[20px] font-semibold text-[#173f86] [text-shadow:none]" style={{ background: BILLOW }}>
                {state === "found" || state === "waiting" ? "?" : ""}
              </div>
            </Liquid.Item>
          </Liquid>
          <AnimatePresence>
            {state === "matched" && (
              <motion.span
                className="pointer-events-none absolute text-[17px] font-semibold text-[#173f86] [text-shadow:none]"
                initial={{ opacity: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                you + {name ?? "them"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 text-center"
          >
            <Hand as="h1" className="text-[36px] leading-none font-bold">
              {state === "searching" && "looking around…"}
              {state === "found" && "someone's nearby"}
              {state === "waiting" && "you said yes"}
              {state === "matched" && `you and ${name ?? "them"}`}
              {state === "ended" && "that one slipped away"}
            </Hand>
            <p className="mx-auto mt-2 max-w-[30ch] text-[15px] leading-snug text-on-sky/95">
              {state === "searching" && (
                <>
                  <PlaceTicker />
                  <span className="mt-1 block text-[13px] text-on-sky/90">Usually under a minute · <Elapsed /></span>
                </>
              )}
              {state === "found" && "They're free right now too."}
              {state === "waiting" && "Waiting for them to say yes too."}
              {state === "matched" && (practice ? `${name ?? "They"} is a practice partner, so you can try the whole thing alone.` : "Your quest is ready. Head to the spot and say hi.")}
              {state === "ended" && "No worries. Try again whenever you're free."}
            </p>
          </motion.div>
        </AnimatePresence>

      <div className="flex flex-1 flex-col px-4 pt-6">
        {approx && state === "searching" && <p className="px-6 text-center text-[14px] text-on-sky/95">We couldn&apos;t get your location, so we&apos;re using the middle of campus.</p>}
        {error && <p className="px-6 pt-1 text-center text-[14px] text-on-sky/95">Signal&apos;s patchy. We&apos;ll keep trying.</p>}

        <Toast
          show={state === "found"}
          title="go together?"
          body={
            <>
              {match?.distance_m != null && <>About {walkMinutes(match.distance_m)} min away ({distance(match.distance_m)}). </>}
              Say yes and you both get the same quest. You&apos;ll see their first name once you both agree, and you&apos;ll meet at the quest spot, never at each other&apos;s.
              {practice && (
                <span className="mt-2 block rounded-[14px] bg-black/5 px-3 py-2 text-[14px] font-medium opacity-100 dark:bg-white/10">
                  This is a practice partner, so you can try the whole thing alone.
                </span>
              )}
            </>
          }
          action={<button className={toastPill} onClick={() => respond(true)} disabled={acting}>Yes, let&apos;s go</button>}
          secondary={<button className={toastQuiet} onClick={() => respond(false)} disabled={acting}>Not now</button>}
        />

        <AnimatePresence>
          {state === "matched" && run && (
            <motion.div
              className="mx-auto mt-2 w-full rounded-[24px] bg-white/85 p-4 text-[#121412] [text-shadow:none] shadow-[0_18px_50px_rgb(13_40_90/0.2)] backdrop-blur-xl dark:bg-[#1b2130]/85 dark:text-white"
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            >
              <p className="text-[13px] font-medium opacity-60">Your quest</p>
              <div className="mt-2 flex items-start gap-3">
                <CategoryIcon category={categoryOf(run.quest)} size={28} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <p className="flex-1 text-[18px] leading-snug font-semibold text-pretty">{run.quest.title.charAt(0).toUpperCase() + run.quest.title.slice(1)}</p>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[15px] font-semibold whitespace-nowrap tabular-nums" aria-label={`${run.quest.coins} coins`}><Coin size={14} />{run.quest.coins}</span>
                  </div>
                  <p className="mt-1 text-[14px] leading-snug opacity-65">
                    {run.quest.place_name ? `${run.quest.place_name} · ` : ""}<span className="whitespace-nowrap">{run.quest.duration_min} min</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto space-y-2 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          {(state === "searching" || state === "waiting") && (
            <button
              onClick={cancel}
              disabled={acting}
              className="mx-auto flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/80 px-6 text-[16px] font-semibold text-[#121412] [text-shadow:none] shadow-[0_6px_20px_rgb(13_40_90/0.15),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-md transition-transform hover:bg-white/90 active:scale-[0.96] dark:bg-white/15 dark:text-white dark:shadow-none dark:ring-1 dark:ring-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              Never mind
            </button>
          )}
          {state === "matched" && match?.run_id && (
            <motion.div initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.5 }}>
              <ButtonLink size="lg" variant="onSky" href={`/quest/${match.run_id}`} className="group">
                See our quest
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </ButtonLink>
            </motion.div>
          )}
          {state === "ended" && <ButtonLink size="lg" variant="onSky" href="/">Back to today</ButtonLink>}
        </div>
      </div>
      </Hero>
    </AppShell>
  );
}
