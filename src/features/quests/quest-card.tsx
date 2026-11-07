import Link from "next/link";
import type { Quest } from "@/lib/contracts";
import { categoryHue, categoryOf, CategoryIcon, Coin } from "@/components/ui/quest-glyph";

export function GlyphTile({ quest, size = 44 }: { quest: Quest; size?: number }) {
  const c = categoryOf(quest);
  return (
    <span className="cat-tint grid shrink-0 place-items-center rounded-[14px]" style={{ width: size, height: size, ["--h" as string]: categoryHue[c] }}>
      <CategoryIcon category={c} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function questMeta(q: Quest) {
  const when = q.type === "event" ? "This week" : null;
  const where = q.place_name ?? "Anywhere";
  return [when, where, `${q.duration_min} min`].filter(Boolean).join(" · ");
}

// A quest at a glance: what it's about (the glyph), what it's called, where and
// how long, and the coins. Everything but the glyph lines up in one column, and
// the description sits under the title, two lines at most.
export function QuestCard({ quest, href, onClick }: { quest: Quest; href?: string; onClick?: () => void }) {
  const body = (
    <div className="flex gap-3.5">
      <GlyphTile quest={quest} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="pt-0.5 font-[family-name:var(--font-body)] text-[16px] leading-snug font-semibold text-pretty">
            {quest.title.charAt(0).toUpperCase() + quest.title.slice(1)}
          </h3>
          <span className="flex shrink-0 items-center gap-1 pt-1 text-[14px] font-semibold tabular-nums">
            <Coin size={14} />
            {quest.coins}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-ink-muted">{questMeta(quest)}</p>
        <p className="mt-2 line-clamp-2 text-[14px] leading-snug text-ink-muted">{quest.description}</p>
      </div>
    </div>
  );
  const cls = "block w-full rounded-[22px] bg-surface p-4 text-left shadow-card ring-1 ring-[var(--hairline)] transition-transform duration-200 active:scale-[0.985]";
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
