import type { Quest } from "@/lib/contracts";

// A fixed set of broad quest categories, each with one line icon. A quest
// inherits a category from a tag with the same name (e.g. tags: ["food"]);
// without one, we guess from its wording, and fall back to "explore".
export const categories = ["food", "study", "sport", "arts", "outdoors", "walk", "fitness", "explore"] as const;
export type Category = (typeof categories)[number];

export const categoryLabel: Record<Category, string> = {
  food: "Food",
  study: "Study spots",
  sport: "Sport",
  arts: "Arts and events",
  outdoors: "Outdoors",
  walk: "Walk",
  fitness: "Fitness",
  explore: "Explore",
};

// Checked in order, so the specific kinds (a walk, a plank) win over loose
// words like "talk" that turn up in any description.
const guesses: [RegExp, Category][] = [
  [/kilomet|\bwalk|\broute\b|\bloop\b|stroll|\bkm\b/, "walk"],
  [/plank|push-?up|squat|stretch|\breps\b|jump|\brun\b|running|backwards/, "fitness"],
  [/snack|food|coffee|drink|lunch|\beat\b|cafe/, "food"],
  [/\bbook|librar|study|lecture/, "study"],
  [/\boval\b|olympic|rink|skat|\bgym\b|\bcourt\b|\bfield\b|ping ?pong|table tennis|foosball|frisbee/, "sport"],
  [/poster|\bevent|\btalk\b|\bshow\b|concert|\bgig\b|\bart\b|\barts\b|music|theatre|gallery/, "arts"],
  [/\bview\b|mountain|window|\bpark\b|\btree|river|sunset|garden|\bbird|\bduck|\bplane|sky/, "outdoors"],
];

export function categoryOf(q: Pick<Quest, "title" | "description" | "place_name" | "tags">): Category {
  const tagged = q.tags?.find((t): t is Category => (categories as readonly string[]).includes(t.toLowerCase()));
  if (tagged) return tagged.toLowerCase() as Category;
  // The title says what the quest is about most clearly, so it gets first say.
  for (const text of [q.title, [q.title, q.place_name, q.description].join(" ")]) {
    const hit = guesses.find(([re]) => re.test(text.toLowerCase()));
    if (hit) return hit[1];
  }
  return "explore";
}

// Each icon as plain SVG markup, so the same drawing works in React and in
// the map's hand-built pins. Every icon is one colour, the current text
// colour (ink on light, white on dark), with no tile behind it. The part that
// moves when you hover a quest card has its own class (glyph-steam,
// glyph-ball and so on), and globals.css animates it.
export const glyphMarkup: Record<Category, string> = {
  // a cup; its steam drifts up
  food:
    '<path d="M5 9.5h11v3.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.2a2.3 2.3 0 0 1 0 4.6H16"/>' +
    '<path class="glyph-steam" d="M8.5 3.8c-.6.8.6 1.6 0 2.6M12 3.8c-.6.8.6 1.6 0 2.6"/>',
  // an open book; its right page lifts and settles
  study:
    '<path d="M12 6.8C10 5.3 7.2 4.8 4 5.2v12.6c3.2-.4 6 .1 8 1.6"/><path d="M12 6.8v12.6"/>' +
    '<g class="glyph-page"><path d="M12 6.8c2-1.5 4.8-2 8-1.6v12.6c-3.2-.4-6 .1-8 1.6"/><path d="M15.3 5.9v5.4l1.4-1.1 1.4 1.1V5.5"/></g>',
  // a ball: a pentagon in the middle with short seams that stop well inside the rim. It rolls.
  sport:
    '<g class="glyph-ball"><circle cx="12" cy="12" r="8"/>' +
    '<path d="M12 9.4l2.5 1.8-1 2.9h-3l-1-2.9z"/>' +
    '<path d="M12 9.4V6.8M14.5 11.2l2.4-.8M13.5 14.1l1.5 2M10.5 14.1l-1.5 2M9.5 11.2l-2.4-.8"/></g>',
  // a poster on a pin; it swings from the pin
  arts:
    '<g class="glyph-poster"><path d="M6.5 4.5h11v15h-11z"/><path d="M9.5 8.8h5M9.5 12h5M9.5 15h2.5"/></g>' +
    '<circle cx="12" cy="4.5" r="1.1" fill="currentColor" stroke="none"/>',
  // a tree; its canopy sways on the trunk
  outdoors:
    '<path d="M12 15.5v4.5"/>' +
    '<path class="glyph-canopy" d="M12 3.5l-4.8 6.3h2.6L5.5 15.5h13l-4.3-5.7h2.6z"/>',
  // a dotted trail to a flag; the dots march along and the flag flutters
  walk:
    '<path class="glyph-trail" d="M6 18c2.5-.2 3.2-2.4 4.4-5.2C11.8 9.6 13.6 8 18 6.5" stroke-dasharray="0.1 3.1" stroke-width="2.1"/>' +
    '<circle cx="5.5" cy="18" r="1.8"/><path d="M18 3.8v5"/><path class="glyph-flag" d="M18 3.8l2.6 1.3L18 6.4"/>',
  // a stopwatch; its hand ticks round once
  fitness:
    '<circle cx="12" cy="13.5" r="6.5"/><path d="M10 3.5h4M12 3.5V7M17.4 7.6l1.1-1.1"/>' +
    '<path class="glyph-hand" d="M12 13.5V10"/><circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none"/>',
  // a compass; its needle wobbles and settles
  explore:
    '<circle cx="12" cy="12" r="8"/><path class="glyph-needle" d="M14.8 9.2l-1.6 4-4 1.6 1.6-4z"/>',
};

// The whole drawing as one string, drawn through the #ink filter (root
// layout) so it wobbles like pen lines.
function inner(category: Category) {
  return `<g filter="url(#ink)">${glyphMarkup[category]}</g>`;
}

export function glyphSvg(category: Category, size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner(category)}</svg>`;
}

export function CategoryIcon({ category, size = 22, className = "" }: { category: Category; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: inner(category) }}
    />
  );
}

// A tiny coin: a disc with a rim, in warm gold, with the same ink wobble as the icons. Coins are the one thing that
// gets colour on a card, because they're a reward rather than a status.
export function Coin({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <g filter="url(#ink)">
        <circle cx="8" cy="8" r="7" fill="#f0c04a" stroke="#c9922a" strokeWidth=".9" />
        <circle cx="8" cy="8" r="4.6" fill="none" stroke="#c9922a" strokeWidth="1.2" />
        <path d="M4.6 4.2a5 5 0 0 1 4.2-1.6" stroke="#fff6d8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".9" />
      </g>
    </svg>
  );
}
