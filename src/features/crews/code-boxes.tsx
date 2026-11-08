"use client";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

// A crew code drawn as a row of letter boxes, like a one-time-code field.
// One real <input> lies invisibly over the boxes and holds the value, so
// typing, paste, screen readers and phone keyboards all work as normal; the
// boxes only draw what's in it. A code is a word, a dash, then up to three
// characters (MAPLE-42K, or MAPLE-42 for older ones), so the word part grows a
// box at a time past five letters and the dash is a fixed mark in the middle.

export type CodeState = "typing" | "locked" | "wrong" | "joined";

const WORD_BOXES = 5; // our shortest crew word
const TAIL_BOXES = 3;

// Upper-case it, drop anything that isn't a letter or digit, and split it into
// the leading letters (the word) and what comes after (the tail).
export function splitCode(raw: string) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = clean.match(/^[A-Z]*/)![0];
  return { word: letters.slice(0, 8), tail: clean.slice(letters.length, letters.length + TAIL_BOXES) };
}

// "maple 42k" and "MAPLE42K" both become "MAPLE-42K".
export function formatCode(raw: string) {
  const { word, tail } = splitCode(raw);
  return tail ? `${word}-${tail}` : word;
}

export function CodeBoxes({
  id,
  value,
  onChange,
  onEnter,
  state,
  describedBy,
  badge,
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
  onEnter?: () => void;
  state: CodeState;
  describedBy?: string;
  badge?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const { word, tail } = splitCode(value);
  const settled = state === "locked" || state === "joined";

  // While typing, show at least five word boxes and three after the dash. Once
  // the code matches, the empty ones fold away so the row is exactly the code.
  const wordCount = settled ? word.length : Math.max(WORD_BOXES, word.length);
  const tailCount = settled ? tail.length : TAIL_BOXES;
  const boxes = [
    ...Array.from({ length: wordCount }, (_, i) => ({ key: `w${i}`, char: word[i] ?? "" })),
    { key: "dash", char: "-" },
    ...Array.from({ length: tailCount }, (_, i) => ({ key: `t${i}`, char: tail[i] ?? "" })),
  ];
  // The caret sits on the next box to fill: in the word until it has five
  // letters, then after the dash (a sixth letter still grows the word).
  const caret = tail || word.length >= WORD_BOXES ? (tail.length < TAIL_BOXES ? `t${tail.length}` : null) : `w${word.length}`;

  // To join, every box flies to the middle of the row, where the crew badge
  // appears. So first measure how far each box is from the middle.
  const row = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState<number[]>([]);
  useLayoutEffect(() => {
    if (state !== "joined" || !row.current) return;
    const r = row.current.getBoundingClientRect();
    const mid = r.left + r.width / 2;
    setPull(Array.from(row.current.children, (el) => { const b = el.getBoundingClientRect(); return mid - (b.left + b.width / 2); }));
  }, [state]);

  let n = -1; // counts letter boxes only, for the one-after-another delays
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <motion.div
        ref={row}
        aria-hidden
        className="flex h-[54px] items-center justify-center gap-[5px]"
        data-wrong={state === "wrong" ? "" : undefined}
        animate={state === "wrong" && !reduce ? { x: [0, -9, 8, -5, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        {boxes.map((b, i) => {
          if (b.key === "dash") {
            return (
              <motion.span
                key="dash"
                className="mx-[3px] h-[3px] w-[10px] shrink-0 rounded-full bg-white/85"
                animate={state === "joined" ? { x: pull[i] ?? 0, opacity: 0, scale: 0.3 } : { x: 0, opacity: 1, scale: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.36, ease: [0.5, 0, 0.75, 0] }}
              />
            );
          }
          const k = ++n;
          return (
            <motion.span
              key={b.key}
              className={`jc-box ${settled ? "jc-box-locked" : "glass-sky"} numeral relative grid h-full max-w-[42px] min-w-0 flex-1 basis-0 place-items-center rounded-[12px] text-[26px] leading-none ${focused && caret === b.key ? "jc-box-active" : ""}`}
              style={{ transitionDelay: settled && !reduce ? `${k * 45}ms` : "0ms" }}
              animate={
                state === "joined"
                  ? { x: pull[i] ?? 0, scale: 0.3, opacity: 0 }
                  : state === "locked" && !reduce
                    ? { x: 0, scale: [1, 1.14, 1], opacity: 1 }
                    : { x: 0, scale: 1, opacity: 1 }
              }
              transition={
                reduce
                  ? { duration: 0 }
                  : state === "joined"
                    ? { duration: 0.38, ease: [0.5, 0, 0.75, 0], delay: k * 0.025 }
                    : { duration: 0.34, ease: "easeOut", delay: state === "locked" ? k * 0.045 : 0 }
              }
            >
              {b.char}
              {focused && caret === b.key && <span className="jc-caret absolute top-1/2 left-1/2 h-[26px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />}
            </motion.span>
          );
        })}
      </motion.div>
      {state === "joined" && badge && (
        <motion.div
          className="absolute inset-0 grid place-items-center"
          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 20, delay: 0.3 }}
        >
          {badge}
        </motion.div>
      )}
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(formatCode(e.target.value))}
        onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
        // Keep the cursor at the end, the way the boxes fill. A real selection
        // (select all, then paste or delete) is left alone.
        onSelect={(e) => {
          const el = e.currentTarget;
          const end = el.value.length;
          if (el.selectionStart === el.selectionEnd && el.selectionEnd !== end) el.setSelectionRange(end, end);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={state === "joined"}
        aria-invalid={state === "wrong"}
        aria-describedby={describedBy}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        className={`absolute inset-0 size-full cursor-text text-[16px] caret-transparent opacity-0 ${state === "joined" ? "pointer-events-none" : ""}`}
      />
    </div>
  );
}
