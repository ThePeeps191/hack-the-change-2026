import type { Quest } from "@/lib/contracts";
import { QuestIcon, questTypeLabel } from "@/components/ui/quest-icon";

export function QuestRow({ quest }: { quest: Quest }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <QuestIcon type={quest.type} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-snug text-pretty">{quest.title}</div>
        <div className="truncate text-[13px] text-ink-muted">
          {quest.place_name ?? questTypeLabel[quest.type]} · {quest.proof} proof
        </div>
      </div>
      <div className="text-right tabular-nums">
        <div className="text-sm font-semibold">{quest.duration_min} min</div>
        <div className="text-[13px] font-semibold text-coin">+{quest.coins}</div>
      </div>
    </div>
  );
}
