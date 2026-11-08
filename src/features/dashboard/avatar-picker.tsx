"use client";
// Pick a character: a shape and a colour, for yourself on the You page or for
// your crew on the Crew page. Each tap saves straight away, as "shape:colour"
// (onSave says where), and the reset button goes back to the character the name
// gives. Everyone else sees the same one.
import { useId, useState } from "react";
import { Avatar, avatarColors, avatarShapes, characterFor } from "@/components/ui/avatar";
import GrokBot from "@/lib/bots/grokbot";

const label = (shape: string) => (GrokBot.SHAPES as Record<string, { label: string }>)[shape]?.label ?? shape;

export function AvatarPicker({ name, avatar: saved, note, resetLabel, onSave, className = "rounded-[24px] bg-surface p-4 shadow-card" }: {
  name: string;
  avatar?: string | null;
  note: string;
  resetLabel: string;
  onSave: (avatar: string | null) => Promise<unknown>;
  className?: string;
}) {
  const [avatar, setAvatar] = useState(saved ?? null);
  const [error, setError] = useState(false);
  const { shape, color } = characterFor(name, avatar);
  const colour = avatarColors.indexOf(color);
  const id = useId();

  function save(next: string | null) {
    const before = avatar;
    setAvatar(next); // show it at once; put it back if the save fails
    setError(false);
    onSave(next).catch(() => { setAvatar(before); setError(true); });
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <Avatar name={name} avatar={avatar} size={72} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold">{name}</p>
          <p className="text-[13px] leading-snug text-ink-muted">{note}</p>
        </div>
      </div>

      <p id={`${id}-shape`} className="mt-4 mb-2 px-1 text-[14px] font-medium text-ink-muted">Shape</p>
      <div role="radiogroup" aria-labelledby={`${id}-shape`} className="grid grid-cols-6 gap-1.5">
        {avatarShapes.map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={s === shape}
            aria-label={label(s)}
            onClick={() => save(`${s}:${colour}`)}
            className={`grid aspect-square min-h-11 place-items-center rounded-[14px] ${s === shape ? "bg-accent-soft ring-2 ring-accent" : "bg-sunken"}`}
          >
            <svg viewBox="-1.2 -1.2 2.4 2.4" width="26" height="26" aria-hidden>
              <path d={GrokBot.shapePath(s)} fill={s === shape ? color.fill : "currentColor"} className={s === shape ? "" : "text-ink-faint"} />
            </svg>
          </button>
        ))}
      </div>

      <p id={`${id}-colour`} className="mt-4 mb-2 px-1 text-[14px] font-medium text-ink-muted">Colour</p>
      <div role="radiogroup" aria-labelledby={`${id}-colour`} className="flex flex-wrap gap-2">
        {avatarColors.map((c, i) => (
          <button
            key={c.fill}
            role="radio"
            aria-checked={i === colour}
            aria-label={c.name}
            onClick={() => save(`${shape}:${i}`)}
            className={`size-11 rounded-full ring-offset-2 ring-offset-surface ${i === colour ? "ring-2 ring-ink" : ""}`}
            style={{ background: c.fill }}
          />
        ))}
      </div>

      {error && <p className="mt-3 px-1 text-[14px] text-danger">That didn&apos;t save. Check your signal and try again.</p>}
      {avatar && (
        <button onClick={() => save(null)} className="mt-3 flex min-h-11 items-center px-1 text-[14px] font-medium text-ink-muted hover:text-ink">
          {resetLabel}
        </button>
      )}
    </div>
  );
}
