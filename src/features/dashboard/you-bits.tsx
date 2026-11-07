"use client";
import { motion } from "motion/react";
import type { FamiliarFace, HistoryItem } from "@/lib/contracts";
import { distance } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { categoryOf, CategoryIcon, Coin } from "@/components/ui/quest-glyph";

const ease = [0.16, 1, 0.3, 1] as const;

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// This week, Monday to Sunday, as seven little suns: filled on days you got
// out, an outline for today, faint for days still to come.
export function WeekStrip({ history }: { history: HistoryItem[] }) {
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const done = history.map((h) => new Date(h.completed_at));
  return (
    <ol className="mx-auto mt-5 flex max-w-[320px] justify-between px-2" aria-label="Days you got out this week">
      {days.map((d, i) => {
        const out = done.some((x) => sameDay(x, d));
        const isToday = sameDay(d, today);
        const future = d > today && !isToday;
        const name = d.toLocaleDateString(undefined, { weekday: "narrow" });
        return (
          <li key={i} className="flex flex-col items-center gap-1.5" aria-label={`${d.toLocaleDateString(undefined, { weekday: "long" })}${out ? ", out" : ""}`}>
            <motion.span
              className={`grid size-8 place-items-center rounded-full ${out ? "bg-white text-[var(--color-sky-top)] shadow-[0_0_14px_rgb(255_255_255/0.55)]" : isToday ? "ring-[1.5px] ring-white/80 ring-inset" : future ? "bg-white/8" : "bg-white/15"}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.3 + i * 0.05 }}
            >
              {out && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <circle cx="12" cy="12" r="3.6" fill="currentColor" stroke="none" />
                  <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" />
                </svg>
              )}
            </motion.span>
            <span className={`text-[12px] font-semibold ${isToday ? "text-on-sky" : "text-on-sky/60"}`}>{name}</span>
          </li>
        );
      })}
    </ol>
  );
}

// Time together, as the next milestone rather than a percentage of 50 hours.
const milestones = [60, 120, 300, 600, 1200, 3000];
const milestoneName = (m: number) => (m === 3000 ? "casual friends, about 50 hours" : m >= 60 ? `${m / 60} hour${m === 60 ? "" : "s"} together` : `${m} min`);

function hm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}

export function FaceCard({ face, i }: { face: FamiliarFace; i: number }) {
  const next = milestones.find((m) => m > face.minutes_together) ?? 3000;
  const prev = [...milestones].reverse().find((m) => m <= face.minutes_together) ?? 0;
  const p = Math.min(1, (face.minutes_together - prev) / (next - prev));
  return (
    <motion.li
      className="flex w-[220px] shrink-0 snap-start flex-col rounded-[22px] bg-surface p-4 shadow-card ring-1 ring-[var(--hairline)]"
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease, delay: i * 0.07 }}
    >
      <div className="flex items-center gap-3">
        <Avatar name={face.display_name} size={44} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold">{face.display_name}</p>
          <p className="text-[13px] text-ink-muted">{face.quests_together} quests together</p>
        </div>
      </div>
      <p className="mt-4 text-[22px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{hm(face.minutes_together)}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #ffb59a, #ff8a6b)" }}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(6, p * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease, delay: 0.25 + i * 0.07 }}
        />
      </div>
      <p className="mt-2 text-[13px] leading-snug text-ink-muted">
        <span className="font-semibold text-ink">{hm(next - face.minutes_together)}</span> to {milestoneName(next)}
      </p>
    </motion.li>
  );
}

// New places as stamps in a passport: inked, a little crooked, each with a date.
const inks = ["#2f5fd0", "#b4532a", "#2d7d5a", "#7a4bc2", "#a23a5a"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Stamp({ name, date, i }: { name: string; date: string; i: number }) {
  const h = hash(name);
  const ink = inks[h % inks.length];
  const tilt = (h % 9) - 4;
  const d = new Date(date);
  const short = name.split(",")[0];
  return (
    <motion.li
      className="grid aspect-square place-items-center"
      initial={{ opacity: 0, scale: 1.25, rotate: tilt - 8 }}
      whileInView={{ opacity: 1, scale: 1, rotate: tilt }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.1 + i * 0.12 }}
    >
      <div
        className="flex size-full flex-col items-center justify-center rounded-[20px] border-[1.5px] p-2 text-center mix-blend-multiply dark:mix-blend-normal"
        style={{ borderColor: ink, color: ink, boxShadow: `inset 0 0 0 4px var(--color-surface), inset 0 0 0 5px color-mix(in oklab, ${ink} 50%, transparent)` }}
      >
        <CategoryIcon category={categoryOf({ title: short, description: "", place_name: name, tags: [] })} size={20} />
        <p className="mt-1 line-clamp-2 text-[12px] leading-tight font-bold tracking-[0.01em] uppercase">{short}</p>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] uppercase opacity-75">
          {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </div>
    </motion.li>
  );
}

export function EmptyStamp() {
  return (
    <li className="grid aspect-square place-items-center rounded-[20px] border-[1.5px] border-dashed border-[var(--color-line)] text-center text-[12px] leading-tight font-medium text-ink-faint">
      <span className="px-3">your next place</span>
    </li>
  );
}

// How you felt after each quest, as a little row of weather.
export function Weather({ better, total }: { better: number; total: number }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(total, 10)}, minmax(0, 1fr))` }} aria-label={`Felt better after ${better} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const sun = i < better;
        return (
          <motion.span
            key={i}
            className={`grid aspect-square max-w-9 place-items-center rounded-full ${sun ? "bg-[#fff1c9] text-[#e0a21f] dark:bg-[#3a3016]" : "bg-sunken text-ink-faint"}`}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease, delay: 0.1 + i * 0.05 }}
          >
            {sun ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
                <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7.5 18.5a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17.6 9.6a4.5 4.5 0 0 1-.6 8.9z" />
              </svg>
            )}
          </motion.span>
        );
      })}
    </div>
  );
}

// One journal entry: a date block, what you did, with whom, and the coins.
export function Entry({ h, i }: { h: HistoryItem; i: number }) {
  const d = new Date(h.completed_at);
  return (
    <motion.li
      className="flex items-center gap-3.5 px-4 py-3.5"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease, delay: i * 0.05 }}
    >
      <div className="flex w-11 shrink-0 flex-col items-center rounded-[12px] bg-sunken py-1.5 leading-none">
        <span className="text-[10px] font-bold tracking-[0.1em] text-danger uppercase">{d.toLocaleDateString(undefined, { month: "short" })}</span>
        <span className="mt-0.5 text-[19px] font-semibold tabular-nums">{d.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium">{h.quest.title.charAt(0).toUpperCase() + h.quest.title.slice(1)}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-muted">
          <CategoryIcon category={categoryOf(h.quest)} size={14} className="text-ink-faint" />
          {h.partner ? `with ${h.partner.display_name}` : "on your own"} · {distance(h.distance_m)}
        </p>
      </div>
      <span className="flex items-center gap-1 text-[14px] font-semibold tabular-nums">
        <Coin size={13} />+{h.coins}
      </span>
    </motion.li>
  );
}
