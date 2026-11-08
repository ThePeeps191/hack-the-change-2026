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

// Each category has its own hue, so you can tell a food quest from a walk at a
// glance on the map and in lists. Only one detail of each icon uses it.
export const categoryHue: Record<Category, number> = {
  food: 22,
  study: 245,
  sport: 352,
  arts: 300,
  outdoors: 135,
  walk: 172,
  fitness: 40,
  explore: 205,
};

// Checked in order, so the specific kinds (a walk, a plank) win over loose
// words like "talk" that turn up in any description.
const guesses: [RegExp, Category][] = [
  [/kilomet|\bwalk|\broute\b|\bloop\b|stroll|\bkm\b/, "walk"],
  [/plank|push-?up|squat|stretch|\breps\b|jump|\brun\b|running|backwards/, "fitness"],
  [/snack|food|coffee|drink|lunch|\beat\b|cafe/, "food"],
  [/\bbook|librar|study|lecture/, "study"],
  [/\boval\b|olympic|rink|skat|\bgym\b|\bcourt\b|\bfield\b|ping ?pong|table tennis|frisbee/, "sport"],
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
// the map's hand-built pins. An icon is drawn in ink, with one detail picked
// out in its category's colour, like a spot colour in a print: the tree's
// canopy, the cup's steam, the compass needle. No tile behind it.
export const glyphMarkup: Record<Category, { base: string; accent: string }> = {
  food: {
    base: '<path d="M5 9.5h11v3.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.2a2.3 2.3 0 0 1 0 4.6H16"/>',
    accent: '<path d="M8.5 3.8c-.6.8.6 1.6 0 2.6M12 3.8c-.6.8.6 1.6 0 2.6"/>',
  },
  study: {
    base: '<path d="M12 6.8C10 5.3 7.2 4.8 4 5.2v12.6c3.2-.4 6 .1 8 1.6 2-1.5 4.8-2 8-1.6V5.2c-3.2-.4-6 .1-8 1.6z"/><path d="M12 6.8v12.6"/>',
    accent: '<path d="M15.3 5.9v5.4l1.4-1.1 1.4 1.1V5.5"/>',
  },
  sport: {
    base: '<circle cx="12" cy="12" r="8"/>',
    accent: '<path d="M4.5 9.5c3 1.2 4.6 3.6 4.9 10M19.5 9.5c-3 1.2-4.6 3.6-4.9 10M7 5.6c2.7 1.6 7.3 1.6 10 0"/>',
  },
  arts: {
    base: '<path d="M6.5 4.5h11v15h-11z"/><path d="M9.5 12h5M9.5 15h2.5"/>',
    accent: '<path d="M9.5 8.8h5"/><circle cx="12" cy="4.5" r="1.1" fill="currentColor" stroke="none"/>',
  },
  outdoors: {
    base: '<path d="M12 15.5v4.5"/>',
    accent: '<path d="M12 3.5l-4.8 6.3h2.6L5.5 15.5h13l-4.3-5.7h2.6z"/>',
  },
  walk: {
    base: '<path d="M6 18c2.5-.2 3.2-2.4 4.4-5.2C11.8 9.6 13.6 8 18 6.5" stroke-dasharray="0.1 3.1" stroke-width="2.1"/><circle cx="5.5" cy="18" r="1.8"/>',
    accent: '<path d="M18 3.8v5M18 3.8l2.6 1.3L18 6.4"/>',
  },
  fitness: {
    base: '<circle cx="12" cy="13.5" r="6.5"/><path d="M10 3.5h4M12 3.5V7M17.4 7.6l1.1-1.1"/>',
    accent: '<path d="M12 13.5V10"/><circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none"/>',
  },
  explore: {
    base: '<circle cx="12" cy="12" r="8"/>',
    accent: '<path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4z"/>',
  },
};

// The whole drawing as one string: ink, then the accent in the category hue
// (the .cat-accent class reads --h).
function inner(category: Category) {
  const g = glyphMarkup[category];
  // drawn through the #ink filter (root layout), so they wobble like pen lines
  return `<g filter="url(#ink)">${g.base}<g class="cat-accent" style="--h:${categoryHue[category]}">${g.accent}</g></g>`;
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

// A tiny coin: a disc with a rim, in warm gold. Coins are the one thing that
// gets colour on a card, because they're a reward rather than a status.
export function Coin({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="7" fill="#f0c04a" />
      <circle cx="8" cy="8" r="4.6" fill="none" stroke="#c9922a" strokeWidth="1.2" />
      <path d="M4.6 4.2a5 5 0 0 1 4.2-1.6" stroke="#fff6d8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".9" />
    </svg>
  );
}
