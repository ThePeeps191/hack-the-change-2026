import Link from "next/link";
import type { Quest } from "@/lib/contracts";
import { QuestIcon, questTypeLabel } from "@/components/ui/quest-icon";

// A compact quest card: bold title with the time on the right, one muted
// line of what you'll do, and the kind, place and coins underneath.
export function QuestCard({ quest, href, onClick }: { quest: Quest; href?: string; onClick?: () => void }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-[family-name:var(--font-body)] text-[16px] leading-snug font-semibold text-pretty">{quest.title.charAt(0).toUpperCase() + quest.title.slice(1)}</h3>
        <span className="shrink-0 pt-0.5 text-[13px] font-medium text-ink-muted tabular-nums">{quest.duration_min} min</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-ink-muted">{quest.description}</p>
      <div className="mt-2.5 flex items-center gap-2 text-[13px] text-ink-muted">
        <QuestIcon type={quest.type} size={8} />
        <span className="truncate">{quest.place_name ?? questTypeLabel[quest.type]}</span>
        {quest.tags?.slice(0, 1).map((t) => <span key={t} className="text-ink-faint">· {t}</span>)}
        <span className="ml-auto font-semibold text-ink tabular-nums">+{quest.coins}</span>
      </div>
    </>
  );
  const cls = "block w-full rounded-[20px] bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.985]";
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
