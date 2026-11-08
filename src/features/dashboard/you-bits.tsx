"use client";
import { CloudInk, Ink, SunInk } from "@/components/ui/ink";
import { motion } from "motion/react";
import Link from "next/link";
import type { FamiliarFace, HistoryItem, WeekDay } from "@/lib/contracts";
import { distance } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { categoryOf, CategoryIcon, Coin } from "@/components/ui/quest-glyph";

const ease = [0.16, 1, 0.3, 1] as const;

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// This week, Monday to Sunday, as seven little suns: filled on days you got
// out, an outline for today, faint for days still to come. The server sends the
// days (src/server/week.ts, time_bucket on Tiger Data); history is the fallback.
export function WeekStrip({ history, week }: { history: HistoryItem[]; week?: WeekDay[] }) {
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
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromServer = new Map((week ?? []).map((w) => [w.day, w.quests > 0 || w.moving_minutes > 0]));
  return (
    <ol className="mx-auto mt-5 flex max-w-[320px] justify-between px-2" aria-label="Days you got out this week">
      {days.map((d, i) => {
        const out = fromServer.get(key(d)) ?? done.some((x) => sameDay(x, d));
        const isToday = sameDay(d, today);
        const future = d > today && !isToday;
        const name = d.toLocaleDateString(undefined, { weekday: "narrow" });
        return (
          <li key={i} className="flex flex-col items-center gap-1.5" aria-label={`${d.toLocaleDateString(undefined, { weekday: "long" })}${out ? ", out" : ""}`}>
            {/* drawn in ink, no discs: a sun on days you got out, a hand-drawn
                ring round today, a short pen stroke for the rest */}
            <motion.span
              className={`grid size-8 place-items-center text-on-sky ${out ? "" : future ? "opacity-35" : "opacity-60"}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.3 + i * 0.05 }}
            >
              {out ? (
                <Ink size={30} className="drop-shadow-[0_0_8px_rgb(255_255_255/0.45)]">{SunInk}</Ink>
              ) : isToday ? (
                <Ink size={28}><path d="M12.4 4.6c4-.2 7.2 3 7 7-.2 4-3.5 7-7.5 6.9-3.8-.1-6.7-3.3-6.5-7.1.2-3.4 2.9-6.4 6.4-6.9" /></Ink>
              ) : (
                <Ink size={22}><path d="M8.6 12.6c2.2-.9 4.6-.9 6.8-.2" /></Ink>
              )}
            </motion.span>
            <span className="text-[12px] font-semibold text-on-sky">{name}</span>
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

export function FaceCard({ face, i, wide = false }: { face: FamiliarFace; i: number; wide?: boolean }) {
  const next = milestones.find((m) => m > face.minutes_together) ?? 3000;
  const prev = [...milestones].reverse().find((m) => m <= face.minutes_together) ?? 0;
  const p = Math.min(1, (face.minutes_together - prev) / (next - prev));
  return (
    <motion.li
      className={`flex ${wide ? "w-full" : "w-[220px]"} shrink-0 snap-start flex-col rounded-[22px] bg-surface p-4 shadow-card ring-1 ring-[var(--hairline)]`}
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

// How you felt after each quest, as a little row of weather.
export function Weather({ better, total }: { better: number; total: number }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(total, 10)}, minmax(0, 1fr))` }} aria-label={`Felt better after ${better} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const sun = i < better;
        return (
          <motion.span
            key={i}
            className={`grid aspect-square max-w-9 place-items-center ${sun ? "text-[#c98a12] dark:text-[#f2c45a]" : "text-ink-faint"}`}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease, delay: 0.1 + i * 0.05 }}
          >
            <Ink size={28}>{sun ? SunInk : CloudInk}</Ink>
          </motion.span>
        );
      })}
    </div>
  );
}

// Try the demo shares one guest, so the same quest with the same partner can
// pile up on one day. Fold those into one row with a count and their coins
// added up. History comes newest first, so each row keeps the newest run's link.
export type JournalRow = HistoryItem & { times: number };
export function collapseRepeats(history: HistoryItem[]): JournalRow[] {
  const rows: JournalRow[] = [];
  for (const h of history) {
    const same = rows.find(
      (r) => r.quest.id === h.quest.id && r.partner?.display_name === h.partner?.display_name && sameDay(new Date(r.completed_at), new Date(h.completed_at)),
    );
    if (same) {
      same.times += 1;
      same.coins += h.coins;
    } else {
      rows.push({ ...h, times: 1 });
    }
  }
  return rows;
}

// One journal entry: a date block, what you did, with whom, and the coins.
export function Entry({ h, i }: { h: JournalRow; i: number }) {
  const d = new Date(h.completed_at);
  // Opens the quest's recap: the date, what the AI wrote, and the photos or videos you sent as proof.
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease, delay: i * 0.05 }}
    >
      <Link href={`/recap/${h.run_id}?from=me`} className="flex items-center gap-3.5 px-4 py-3.5 active:bg-sunken">
      <div className="flex w-11 shrink-0 flex-col items-center rounded-[12px] bg-sunken py-1.5 leading-none">
        <span className="text-[10px] font-bold tracking-[0.1em] text-danger uppercase">{d.toLocaleDateString(undefined, { month: "short" })}</span>
        <span className="mt-0.5 text-[19px] font-semibold tabular-nums">{d.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-1.5 text-[17px] font-semibold">
          <span className="truncate">{h.quest.title.charAt(0).toUpperCase() + h.quest.title.slice(1)}</span>
          {h.times > 1 && <span className="shrink-0 text-[15px] text-ink-muted tabular-nums"><span aria-hidden>×{h.times}</span><span className="sr-only">, {h.times} times</span></span>}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-muted">
          <CategoryIcon category={categoryOf(h.quest)} size={14} className="text-ink-faint" />
          {h.partner ? `with ${h.partner.display_name}` : "on your own"}{h.distance_m >= 50 && <> · {distance(h.distance_m)}</>}
        </p>
      </div>
      {h.coins > 0 && (
        <span className="flex items-center gap-1 text-[14px] font-semibold tabular-nums">
          <Coin size={13} />+{h.coins}
        </span>
      )}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-faint" aria-hidden>
        <path d="M9 6l6 6-6 6" />
      </svg>
      </Link>
    </motion.li>
  );
}
