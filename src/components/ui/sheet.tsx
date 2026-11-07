"use client";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { tick } from "@/lib/feedback";

// A bottom sheet over a blurred scrim. Drag the handle (or the sheet) down to
// dismiss; it springs back if you don't pull far enough. Escape closes it.
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const drag = useDragControls();

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
        <div className="fixed inset-0 z-50 flex items-end justify-center">
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
            className="relative max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[32px] bg-surface pb-[max(16px,env(safe-area-inset-bottom))] shadow-lift"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y"
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
            <div className="sticky top-0 z-10 flex cursor-grab touch-none justify-center bg-surface pt-3 pb-2 active:cursor-grabbing" onPointerDown={(e) => drag.start(e)}>
              <span className="h-1.5 w-10 rounded-full bg-line" aria-hidden />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
