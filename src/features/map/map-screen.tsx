"use client";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Quest } from "@/lib/contracts";
import { tick } from "@/lib/feedback";
import { getPosition } from "@/lib/geo";
import { CAMPUS_CENTER } from "@/lib/config";
import { AppShell, Hand } from "@/components/ui/app-shell";
import { Skeleton } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import type { GlobeMarker } from "@/components/map/globe-map";
import { categoryOf, glyphSvg } from "@/components/ui/quest-glyph";
import { GlyphTile, QuestCard, questMeta } from "@/features/quests/quest-card";
import { Coin } from "@/components/ui/quest-glyph";
import { QuestSheet } from "@/features/quests/quest-sheet";

const GlobeMap = dynamic(() => import("@/components/map/globe-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse" style={{ background: "linear-gradient(180deg, var(--color-sky-top), var(--color-sky-bottom))" }} />,
});

type Filter = "all" | "local" | "event";
const markColor = { local: "var(--color-local)", event: "var(--color-event)", anywhere: "var(--color-anywhere)" } as const;
const soft = { type: "spring", stiffness: 260, damping: 32 } as const;

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

type LatLng = { lat: number; lng: number };

// Straight-line metres between two points; plenty for sorting a campus.
function metres(a: LatLng, b: LatLng) {
  const k = Math.PI / 180;
  const x = (b.lng - a.lng) * k * Math.cos(((a.lat + b.lat) / 2) * k);
  const y = (b.lat - a.lat) * k;
  return Math.sqrt(x * x + y * y) * 6371000;
}

// The list shows the closest few as full cards; the rest fold into one card
// of short rows that opens like a dropdown.
const TOP = 3;

const frosted = "glass grid size-11 place-items-center rounded-full text-ink transition-transform active:scale-95";

export function MapScreen() {
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<Quest | null>(null);
  const [here, setHere] = useState<LatLng>(CAMPUS_CENTER);
  const [located, setLocated] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    api.quests().then(setQuests).catch(() => setQuests([]));
    // Only used to sort by distance on this phone; never sent or logged.
    getPosition().then((p) => {
      setHere({ lat: p.lat, lng: p.lng });
      setLocated(!p.approximate);
    });
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  // Nearest first; quests with no place go last.
  const away = (q: Quest) => (q.lat != null && q.lng != null ? metres(here, { lat: q.lat, lng: q.lng }) : Infinity);
  const shown = (quests ?? []).filter((q) => (filter === "all" ? true : q.type === filter)).sort((a, b) => away(a) - away(b));
  const placed = shown.filter((q) => q.lat != null && q.lng != null);
  // Quests within about 60 m of each other share one pin, so pins never pile up.
  const markers = useMemo<GlobeMarker[]>(() => {
    const groups: Quest[][] = [];
    for (const q of placed) {
      const g = groups.find((x) => metres({ lat: x[0].lat!, lng: x[0].lng! }, { lat: q.lat!, lng: q.lng! }) < 60);
      if (g) g.push(q);
      else groups.push([q]);
    }
    return groups.map((g) => {
      const q = g[0];
      const label = `${q.place_name ?? q.title}${g.length > 1 ? ` · ${g.length} quests` : ""}`;
      return { id: q.id, lat: q.lat!, lng: q.lng!, color: markColor[q.type], label, icon: glyphSvg(categoryOf(q), 20) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the visible set changes
  }, [quests, filter, here]);
  const picked = shown.find((q) => q.id === selected) ?? null;
  const pinFor = (id: string | null) => {
    const q = placed.find((x) => x.id === id);
    if (!q) return id;
    return markers.find((m) => metres(m, { lat: q.lat!, lng: q.lng! }) < 60)?.id ?? id;
  };
  const ordered = picked ? [picked, ...shown.filter((q) => q.id !== picked.id)] : shown;

  function choose(id: string) {
    const q = (quests ?? []).find((x) => x.id === id);
    setSelected(id);
    if (q?.lat != null && q.lng != null) setFocus({ lat: q.lat, lng: q.lng });
  }

  // First tap on a quest with a place shows it on the map; the next opens it.
  function tap(q: Quest) {
    if (q.id === selected || q.lat == null) setOpen(q);
    else choose(q.id);
  }

  function toggle() {
    tick(0.8);
    setExpanded((e) => !e);
  }

  const behind = {
    animate: expanded ? { scale: 0.94, opacity: 0.5, filter: "blur(10px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    style: { transformOrigin: "50% 0%" },
  };

  return (
    <AppShell>
      <motion.header {...behind} className="px-5 pt-[max(18px,env(safe-area-inset-top))] pb-3">
        <Hand as="h1" className="text-[36px] leading-none font-bold">around you</Hand>
        <p className="mt-1 text-[14px] text-ink-muted">Drag to look around. Tap a pin to see what&apos;s there.</p>
      </motion.header>

      {/* The map keeps its slot in the page so nothing jumps when it opens up. */}
      <div className="relative mx-4 h-[50dvh] min-h-[320px]">
        <AnimatePresence>
          {expanded && (
            <motion.button
              aria-label="Close the map"
              className="fixed inset-0 z-40 bg-[var(--scrim)] backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={toggle}
            />
          )}
        </AnimatePresence>
        <motion.div
          layout
          transition={soft}
          className={
            expanded
              ? "fixed inset-x-2.5 top-[max(10px,env(safe-area-inset-top))] bottom-[max(10px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-[620px] overflow-hidden rounded-[32px] shadow-lift"
              : "absolute inset-0 overflow-hidden rounded-[28px] shadow-card"
          }
          style={{ borderRadius: expanded ? 32 : 28 }}
        >
          <GlobeMap markers={markers} selected={pinFor(selected)} onSelect={choose} focus={focus} here={located ? here : null} fit />

          <motion.div layout="position" className="absolute top-3 right-3 flex flex-col gap-2">
            <button onClick={toggle} aria-label={expanded ? "Shrink the map" : "Expand the map"} className={frosted}>
              <Icon d={expanded ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"} />
            </button>
          </motion.div>

          <AnimatePresence>
            {expanded && picked && (
              <motion.div
                key={picked.id}
                className="absolute inset-x-3 bottom-3"
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <QuestCard quest={picked} onClick={() => setOpen(picked)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.section {...behind} className="px-4 pt-4" aria-label="Quests on the map">
        <Segmented<Filter>
          label="Show"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setSelected(null);
            setMore(false);
            // Fly to the nearest quest of this kind so the pins are in view.
            const first = (quests ?? []).filter((q) => (v === "all" || q.type === v) && q.lat != null && q.lng != null).sort((a, b) => away(a) - away(b))[0];
            if (first) setFocus({ lat: first.lat!, lng: first.lng! });
          }}
          // Events only shows up as a choice when there's an event to show.
          options={[
            { value: "all", label: "Everything" },
            { value: "local", label: "Nearby" },
            ...((quests ?? []).some((q) => q.type === "event") ? [{ value: "event" as const, label: "Events" }] : []),
          ]}
        />
        <div className="mt-3 flex flex-col gap-2.5">
          {quests === null
            ? [0, 1].map((i) => <Skeleton key={i} className="h-[104px] rounded-[20px]" />)
            : ordered.length === 0
              ? (
                  <div className="flex items-center justify-between gap-3 rounded-[20px] bg-surface px-4 py-3.5 shadow-card">
                    <p className="text-[15px] text-ink-muted">Nothing of this kind nearby right now.</p>
                    {filter !== "local" && (
                      <button onClick={() => setFilter("local")} className="min-h-11 shrink-0 rounded-full bg-accent px-4 text-[15px] font-semibold text-on-accent active:scale-95">
                        Try nearby
                      </button>
                    )}
                  </div>
                )
              : (
                  <>
                    {ordered.slice(0, TOP).map((q) => (
                      <motion.button
                        layout
                        transition={soft}
                        key={q.id}
                        onClick={() => tap(q)}
                        className={`block w-full rounded-[20px] text-left outline-offset-2 ${q.id === selected ? "outline-2 outline-accent" : ""}`}
                        aria-pressed={q.id === selected}
                      >
                        <QuestCard quest={q} />
                      </motion.button>
                    ))}
                    {ordered.length > TOP && (
                      <motion.div layout transition={soft} className="overflow-hidden rounded-[22px] bg-surface shadow-card ring-1 ring-[var(--hairline)]">
                        <button
                          onClick={() => { tick(0.6); setMore((m) => !m); }}
                          aria-expanded={more}
                          aria-controls="more-quests"
                          className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left"
                        >
                          <span className="text-[16px] font-semibold">
                            {more ? "Fewer quests" : `${ordered.length - TOP} more quests`}
                            {!more && <span className="font-normal text-ink-muted"> · farther away</span>}
                          </span>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 text-ink-muted transition-transform duration-300 ${more ? "rotate-180" : ""}`}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        <AnimatePresence initial={false}>
                          {more && (
                            <motion.ul
                              id="more-quests"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {ordered.slice(TOP).map((q) => (
                                <li key={q.id} className="border-t border-[var(--hairline)]">
                                  <button onClick={() => tap(q)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-[var(--hairline)]">
                                    <GlyphTile quest={q} size={36} />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[15px] font-semibold">{q.title.charAt(0).toUpperCase() + q.title.slice(1)}</span>
                                      <span className="block truncate text-[13px] text-ink-muted">{questMeta(q)}</span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold tabular-nums">
                                      <Coin size={14} />
                                      {q.coins}
                                      <span className="sr-only"> coins</span>
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </>
                )}
        </div>
      </motion.section>
      <QuestSheet quest={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}
