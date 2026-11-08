"use client";
// The arithmetic Claim challenge at Math Sciences: ten problems against the
// clock. Tap Start, answer each one (a wrong answer just shakes, so you try
// again), and the timer stops on the last right answer. The finished screen,
// with the time on it, is what the crew photographs as proof, and the time is
// saved in this browser so the Claim result box can fill it in.
import { motion, useAnimate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// The quest in data/claim-quests.json that gets this problem set.
export const ARITHMETIC_QUEST_ID = "a1b2c3d4-0004-4000-8000-000000000001";
const COUNT = 10;
export const timeKey = (runId: string) => `amble-arithmetic-${runId}`;

type Problem = { text: string; answer: number };
const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

// Two-digit sums and differences, times tables up to 12, and divisions that come
// out whole. Never a negative answer, so the number pad is all you need.
function makeProblem(i: number): Problem {
  const kind = i % 4;
  if (kind === 0) { const a = rand(12, 89), b = rand(12, 89); return { text: `${a} + ${b}`, answer: a + b }; }
  if (kind === 1) { const a = rand(30, 99), b = rand(11, a - 1); return { text: `${a} − ${b}`, answer: a - b }; }
  if (kind === 2) { const a = rand(3, 12), b = rand(3, 12); return { text: `${a} × ${b}`, answer: a * b }; }
  const b = rand(3, 12), answer = rand(3, 12);
  return { text: `${b * answer} ÷ ${b}`, answer };
}

function savedTime(runId: string) {
  try { const v = Number(localStorage.getItem(timeKey(runId))); return v > 0 ? v : null; } catch { return null; }
}

export function ProblemSet({ runId }: { runId: string }) {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [step, setStep] = useState(0);
  const [value, setValue] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [scope, animate] = useAnimate();

  // A finished set survives a reload, so the proof photo can still be taken.
  useEffect(() => { setDone(savedTime(runId)); }, [runId]); // eslint-disable-line react-hooks/set-state-in-effect -- read client-only storage after mount

  // The clock on screen ticks ten times a second while the set is running.
  useEffect(() => {
    if (!problems || done != null) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [problems, done]);

  function start() {
    setProblems(Array.from({ length: COUNT }, (_, i) => makeProblem(i)));
    setStep(0);
    setValue("");
    setDone(null);
    setStartedAt(Date.now());
    setNow(Date.now());
    setTimeout(() => input.current?.focus(), 50);
  }

  function check(e: React.FormEvent) {
    e.preventDefault();
    if (!problems || value === "") return;
    if (Number(value) !== problems[step].answer) {
      animate(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.35 });
      setValue("");
      return;
    }
    setValue("");
    if (step + 1 < COUNT) { setStep(step + 1); return; }
    // Whole seconds, rounded up, so the time on screen is the time you send.
    const seconds = Math.max(1, Math.ceil((Date.now() - startedAt) / 1000));
    try { localStorage.setItem(timeKey(runId), String(seconds)); } catch {}
    setDone(seconds);
    setProblems(null);
  }

  const elapsed = Math.max(0, (now - startedAt) / 1000);

  return (
    <section className="rounded-[24px] bg-surface p-5 shadow-card" aria-labelledby="problems-title">
      <h2 id="problems-title" className="text-[17px] font-semibold">The problem set</h2>

      {done != null && !problems ? (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 text-center">
          <p className="text-[14px] text-ink-muted">All {COUNT} right in</p>
          <p className="numeral text-[64px] leading-none tabular-nums">{done} s</p>
          <p className="mt-3 text-[14px] leading-snug text-ink-muted">Photograph this screen at Math Sciences as your proof, then send {done} as your result.</p>
          <Button variant="quiet" className="mt-2 w-full" onClick={start}>Try again for a better time</Button>
        </motion.div>
      ) : problems ? (
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-[14px] text-ink-muted tabular-nums">
            <span>{step + 1} of {COUNT}</span>
            <span aria-live="off">{elapsed.toFixed(1)} s</span>
          </div>
          <form onSubmit={check} className="mt-3 space-y-3">
            <div ref={scope}>
              <label htmlFor="answer" className="block text-center text-[40px] leading-none font-semibold tabular-nums">{problems[step].text} =</label>
              <input
                id="answer"
                ref={input}
                className="mt-3 w-full rounded-[16px] border border-[var(--hairline)] bg-canvas px-4 py-3 text-center text-[32px] tabular-nums"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={value === ""}>Next</Button>
          </form>
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          <p className="text-[15px] leading-snug text-ink-muted">Ten quick sums. The clock starts when you tap Start and stops on your last right answer. A wrong answer just shakes, so keep going.</p>
          <Button size="lg" className="w-full" onClick={start}>Start</Button>
        </div>
      )}
    </section>
  );
}
