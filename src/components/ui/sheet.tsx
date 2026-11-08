"use client";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
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
// dismiss; it springs back if you don't pull far enough. Escape closes it.
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const drag = useDragControls();
  const wide = useWide();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-50 flex justify-center ${wide ? "items-center p-6" : "items-end"}`}>
          <motion.button
            aria-label="Close"
            className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={label}
            className={`relative max-h-[88dvh] w-full max-w-[480px] overflow-y-auto bg-surface pb-[max(16px,env(safe-area-inset-bottom))] shadow-lift ${wide ? "rounded-[32px] pt-4" : "rounded-t-[32px]"}`}
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
            <div className={`sticky top-0 z-10 cursor-grab ${wide ? "hidden" : "flex"} touch-none justify-center bg-surface pt-3 pb-2 active:cursor-grabbing`} onPointerDown={(e) => drag.start(e)}>
              <span className="h-1.5 w-10 rounded-full bg-line" aria-hidden />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
