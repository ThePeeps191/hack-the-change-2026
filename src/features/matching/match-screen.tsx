"use client";
import { Liquid } from "liquid-gooey";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { chime, knock } from "@/lib/feedback";
import { distance, walkMinutes } from "@/lib/format";
import { usePoll } from "@/lib/use-poll";
import { AppShell, Hand, Notice } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon } from "@/components/ui/hero";
import { Toast, toastPill, toastQuiet } from "@/components/ui/toast";

type State = "searching" | "found" | "waiting" | "matched" | "ended";

// How far apart the two of you are drawn, per state. At "matched" the shapes
// overlap and the goo merges them into one.
const gap: Record<State, number> = { searching: 150, found: 96, waiting: 58, matched: 16, ended: 150 };

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
  const d = gap[state];

  return (
    <AppShell nav={false}>
      <Hero className="pb-10">
        <HeroBar
          left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />}
          center={state === "matched" ? "matched" : "finding someone"}
        />
        <div className="relative mx-auto mt-4 grid h-[220px] place-items-center">
          {state === "searching" && (
            <>
              <span className="absolute size-24 -translate-x-[75px] rounded-full border-2 border-white/50 animate-[ripple_2.6s_ease-out_infinite]" />
              <span className="absolute size-24 -translate-x-[75px] rounded-full border-2 border-white/50 animate-[ripple_2.6s_ease-out_1.3s_infinite]" />
            </>
          )}
          <Liquid fill="#ffffff" blur={9} contrast={22} shadow="0 10px 30px rgba(13,40,90,.18)">
            <Liquid.Item x={-d / 2} y={0} transition="bouncy">
              <div className="grid size-[84px] place-items-center rounded-full text-[15px] font-semibold text-[var(--color-sky-top)]">you</div>
            </Liquid.Item>
            <Liquid.Item x={d / 2} y={0} scale={state === "searching" || state === "ended" ? 0.001 : 1} transition="bouncy" delay={80}>
              <div className="grid size-[84px] place-items-center rounded-full text-[15px] font-semibold text-[var(--color-sky-top)]">
                {state === "matched" && name ? name : state === "found" || state === "waiting" ? "?" : ""}
              </div>
            </Liquid.Item>
          </Liquid>
        </div>
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
              {state === "found" && "someone's free"}
              {state === "waiting" && "you said yes"}
              {state === "matched" && `you and ${name ?? "them"}`}
              {state === "ended" && "that one slipped away"}
            </Hand>
            <p className="mx-auto mt-2 max-w-[30ch] text-[15px] leading-snug text-on-sky/85">
              {state === "searching" && "Anyone free within a short walk. Usually under a minute."}
              {state === "found" && "Say yes and we'll both get the same quest."}
              {state === "waiting" && "Waiting for them to say yes too."}
              {state === "matched" && "Your quest is ready. Head to the spot and say hi."}
              {state === "ended" && "No worries. Try again whenever you're free."}
            </p>
          </motion.div>
        </AnimatePresence>
      </Hero>

      <div className="flex flex-1 flex-col px-4 pt-5">
        {approx && state === "searching" && <Notice tone="warning">We couldn&apos;t get your location, so we&apos;re using the middle of campus.</Notice>}
        {error && <Notice tone="warning">Signal&apos;s patchy. We&apos;ll keep trying.</Notice>}

        <Toast
          show={state === "found"}
          title="someone's free nearby"
          body={
            <>
              {match?.distance_m != null && <>About {walkMinutes(match.distance_m)} min away ({distance(match.distance_m)}). </>}
              You&apos;ll see their first name once you both say yes, and you&apos;ll meet at the quest spot, never at each other&apos;s.
            </>
          }
          action={<button className={toastPill} onClick={() => respond(true)} disabled={acting}>Yes, let&apos;s go</button>}
          secondary={<button className={toastQuiet} onClick={() => respond(false)} disabled={acting}>Not now</button>}
        />

        <div className="mt-auto space-y-2 pb-6">
          {(state === "searching" || state === "waiting") && (
            <Button variant="quiet" size="lg" onClick={cancel} disabled={acting}>Never mind</Button>
          )}
          {state === "matched" && match?.run_id && <ButtonLink size="lg" href={`/quest/${match.run_id}`}>See our quest</ButtonLink>}
          {state === "ended" && <ButtonLink size="lg" href="/">Back to today</ButtonLink>}
          {state === "matched" && <p className="text-center text-[13px] text-ink-faint">You can leave or report from the quest at any time.</p>}
        </div>
      </div>
    </AppShell>
  );
}
