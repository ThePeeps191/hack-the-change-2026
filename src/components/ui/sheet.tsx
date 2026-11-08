"use client";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { tick } from "@/lib/feedback";

// From 1024px up (the desktop layout) a sheet shows as a centred dialog
// instead: a bottom sheet glued to the bottom of a wide screen looks lost.
const WIDE = "(min-width: 1024px)";
function useWide() {
  return useSyncExternalStore(
    (on) => { const m = window.matchMedia(WIDE); m.addEventListener("change", on); return () => m.removeEventListener("change", on); },
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

// A bottom sheet over a blurred scrim. Drag the handle (or the sheet) down to
// dismiss; it springs back if you don't pull far enough. Escape or the X closes it.
// For keyboards and screen readers: focus moves into the sheet when it opens,
// Tab stays inside it, and focus goes back to where it was when it closes.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const drag = useDragControls();
  const wide = useWide();
  const panel = useRef<HTMLDivElement>(null);
  // Callers pass a new onClose each render; keep the latest here so the effect
  // below only runs when the sheet opens or closes, not on every keystroke.
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close.current();
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      const inside = panel.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      back?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-50 flex justify-center ${wide ? "items-center p-6" : "items-end"}`}>
          <motion.button
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal
            aria-label={label}
            className={`relative max-h-[88dvh] w-full max-w-[480px] overflow-y-auto bg-surface pb-[max(16px,env(safe-area-inset-bottom))] shadow-lift ${wide ? "rounded-[32px]" : "rounded-t-[32px]"}`}
            initial={wide ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }}
            animate={wide ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={wide ? { opacity: 0, scale: 0.97, y: 8 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag={wide ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) {
                tick(0.6);
                onClose();
              }
            }}
          >
            <div className={`sticky top-0 z-10 flex h-11 touch-none justify-center bg-surface ${wide ? "" : "cursor-grab active:cursor-grabbing"}`} onPointerDown={(e) => !wide && drag.start(e)}>
              {!wide && <span className="mt-3 h-1.5 w-10 rounded-full bg-line" aria-hidden />}
              <button
                type="button"
                aria-label="Close"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                className="absolute top-1 right-2 grid size-11 place-items-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
