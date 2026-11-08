"use client";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import type { Crew } from "@/lib/contracts";
import { tick } from "@/lib/feedback";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { AvatarPicker } from "@/features/dashboard/avatar-picker";

const noop = () => () => {};

// The crew's character at the top of the crew page. Any member can tap it to
// pick a new one in a sheet, using the same picker as the You page. onChanged
// gets the saved crew, so the page and the weekly board update straight away.
export function CrewCharacter({ crew, onChanged }: { crew: Crew; onChanged: (crew: Crew) => void }) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  return (
    <>
      <button
        onClick={() => { tick(0.5); setOpen(true); }}
        aria-label={`Change ${crew.name}'s character`}
        className="relative mb-3 grid size-[72px] place-items-center rounded-full bg-white/90 shadow-[0_8px_24px_rgb(13_40_90/0.2)] transition-transform active:scale-95"
      >
        <Avatar name={crew.name} avatar={crew.avatar} size={52} />
        <span aria-hidden className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full bg-accent text-on-accent ring-2 ring-white">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20l1-5L16 4l4 4L9 19z" />
          </svg>
        </span>
      </button>
      {mounted && createPortal(
        <Sheet open={open} onClose={() => setOpen(false)} label={`${crew.name}'s character`}>
          <div className="px-5 pt-1 pb-2">
            {/* Only while open, so it always starts from what the crew has now. */}
            {open && (
              <AvatarPicker
                name={crew.name}
                avatar={crew.avatar}
                note="Anyone in the crew can change this. It shows on the weekly board."
                resetLabel="Use the original"
                className=""
                onSave={(avatar) => api.setCrewAvatar(crew.id, avatar).then(onChanged)}
              />
            )}
            <Button variant="quiet" className="mt-1 w-full" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </Sheet>,
        document.body,
      )}
    </>
  );
}
