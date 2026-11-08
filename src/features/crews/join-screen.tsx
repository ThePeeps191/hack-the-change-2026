"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { api, ApiError } from "@/lib/api";
import type { Crew } from "@/lib/contracts";
import { chime, knock, tick } from "@/lib/feedback";
import { AppShell, Hand } from "@/components/ui/app-shell";
import Link from "next/link";
import { buttonClass, MagneticButton } from "@/components/ui/button";
import { Hero, HeroBar, HeroIcon, Stars } from "@/components/ui/hero";
import { Ink, PeopleInk } from "@/components/ui/ink";
import { SkySteps, skyQuiet } from "@/components/ui/sky-steps";
import { CodeBoxes, type CodeState, formatCode, splitCode } from "./code-boxes";

const GROUP = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="8.5" cy="12" r="3.2" /><circle cx="15.5" cy="12" r="3.2" /></svg>;
const COIN = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /></svg>;
const FLAG = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 21V4M6 4h11l-2.5 4L17 12H6" /></svg>;

// How long the "you're in" moment plays before we open the crew.
const JOIN_MS = 1100;
const JOIN_MS_REDUCED = 700;

// Join a crew by its code. A link (/join/MAPLE-42K) fills the boxes in; /join
// starts them empty. The code is checked as you type, so the page can name the
// crew (the boxes lock in) or say it's wrong (they shake) before you tap Join.
export function JoinScreen() {
  const params = useParams<{ code?: string }>();
  const fromLink = formatCode(params.code ?? "");
  const router = useRouter();
  const reduce = useReducedMotion();
  const [code, setCode] = useState(fromLink);
  // The last answer from the server, kept with the code it was for, so an
  // answer for an older code is never shown against a newer one.
  const [check, setCheck] = useState<{ code: string; name?: string; bad?: string } | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    api.crews().then(setCrews).catch(() => {});
    return () => clearTimeout(leave.current);
  }, []);

  const { word, tail } = splitCode(code);
  // Older codes have one or two characters after the dash, so check from the
  // first one. A code that came in a link is checked whatever it looks like.
  const checkable = (word.length >= 3 && tail.length >= 1) || (code !== "" && code === fromLink);
  useEffect(() => {
    if (!checkable) return;
    const t = setTimeout(() => {
      api.crewForCode(code).then(
        (c) => setCheck({ code, name: c.name }),
        (e) => setCheck({ code, bad: e instanceof ApiError && e.status === 404 ? e.message : undefined }),
      );
    }, code === fromLink ? 0 : 250);
    return () => clearTimeout(t);
  }, [code, checkable, fromLink]);

  const answer = checkable && check?.code === code ? check : null;
  const name = answer?.name ?? null;
  const mine = crews.find((c) => c.invite_code === code)?.name ?? null;
  // Only call it wrong once the code is whole (three after the dash) or came
  // from a link, so a half-typed MAPLE-4 doesn't shake at you.
  const wrong = !!answer?.bad && (tail.length === 3 || code === fromLink);
  const state: CodeState = joined ? "joined" : name ? "locked" : wrong ? "wrong" : "typing";

  // A small click as the boxes lock in, a soft knock when they shake.
  useEffect(() => {
    if (state === "locked") tick(0.8);
    if (state === "wrong") knock();
  }, [state]);

  // Joining works without the pre-check too, in case the check couldn't reach us.
  const canJoin = !busy && !joined && !mine && !wrong && (name !== null || (checkable && answer !== null && !answer.bad));

  async function join() {
    if (!canJoin) return;
    setBusy(true);
    setError(null);
    router.prefetch("/crew");
    try {
      await api.joinCrew(code);
      chime();
      setJoined(true);
      // The letters fly into the crew badge, then we open the crew. Tapping
      // "Open" skips the wait.
      leave.current = setTimeout(() => router.push("/crew"), reduce ? JOIN_MS_REDUCED : JOIN_MS);
    } catch (e) {
      setError(e instanceof ApiError && e.status !== 0 ? e.message : "Couldn't reach Amble. Try again?");
    }
    setBusy(false);
  }

  const crewName = name ?? "your crew";
  const heading = joined ? "you're in" : mine ? "you're already in" : wrong ? "oops" : "join the crew?";
  const line = joined
    ? <>Welcome to {crewName}. Opening your crew…</>
    : mine
      ? <>That code is for {mine}, and you&apos;re one of them.</>
      : wrong
        ? answer!.bad
        : name
          ? <>{name} is a few friends who get outside together, wherever each of you is.</>
          : "A crew is a few friends who get outside together, wherever each of you is. Type the code a friend sent you.";

  return (
    <AppShell nav={false}>
      <Hero fill className="min-h-dvh pb-[max(20px,env(safe-area-inset-bottom))]">
        <Stars className="opacity-50" />
        <HeroBar left={<HeroIcon href="/" label="Back" d="M14.5 5.5L8 12l6.5 6.5" />} center="a crew invite" />
        <Hand as="h1" className="relative mt-6 text-center text-[44px] leading-none font-bold">{heading}</Hand>
        <p id="jc-line" aria-live="polite" className="relative mx-auto mt-3 min-h-[4lh] max-w-[30ch] px-4 text-center text-[16px] leading-snug text-balance text-on-sky/90">{line}</p>

        <div className="relative mt-7 px-4">
          <label htmlFor="jc-code" className="mb-2 block text-center">
            <Hand as="span" className="text-[20px] leading-none font-bold text-on-sky/90">{joined ? "your crew" : "the crew code"}</Hand>
          </label>
          <CodeBoxes
            id="jc-code"
            value={code}
            onChange={(c) => { setCode(c); setError(null); }}
            onEnter={join}
            state={state}
            describedBy="jc-line"
            badge={
              <Link href="/crew" className="inline-flex min-h-[54px] items-center gap-2.5 rounded-full bg-white px-5 text-[17px] font-semibold text-[#121412] [text-shadow:none] shadow-[0_8px_22px_rgb(20_50_110/0.22)]">
                <Ink size={24} className="text-[var(--color-sky-top)]">{PeopleInk}</Ink>
                {crewName}
              </Link>
            }
          />
        </div>

        {!mine && <div className="mt-9 px-4">
          <SkySteps
            items={[
              { badge: GROUP, title: "do quests together", detail: "Or race each other from anywhere." },
              { badge: COIN, title: "earn coins as a crew", detail: "And climb the weekly board." },
              { badge: FLAG, title: "play Claim", detail: "Hold spots on the map." },
            ]}
          />
        </div>}
        <div className="relative mx-auto mt-auto w-full max-w-[400px] space-y-1 px-4 pt-8">
          {error && <p role="alert" className="pb-3 text-center text-[15px] leading-snug font-medium text-balance">{error}</p>}
          {mine || joined ? (
            <>
              <Link href="/crew" className={buttonClass("onSky", "lg", "w-full")}>Open {mine ?? crewName}</Link>
              {/* Holds the space "Not now" had, so the button doesn't jump while we leave. */}
              {joined && <div aria-hidden className="h-[56px]" />}
            </>
          ) : (
            <>
              <MagneticButton variant="onSky" onClick={join} disabled={!canJoin}>{busy ? "Joining…" : "Join the crew"}</MagneticButton>
              <Link className={skyQuiet} href="/">Not now</Link>
            </>
          )}
        </div>
      </Hero>
    </AppShell>
  );
}
