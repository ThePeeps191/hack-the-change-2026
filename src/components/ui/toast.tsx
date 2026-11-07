"use client";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

// A dark notification card that drops in from the top, like a real push: a
// coloured dot, a title, a line of detail and one white pill action.
export function Toast({
  show,
  title,
  body,
  dot = "var(--color-accent)",
  action,
  secondary,
}: {
  show: boolean;
  title: ReactNode;
  body?: ReactNode;
  dot?: string;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="alert"
          initial={{ y: -40, opacity: 0, scale: 0.96, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ y: -30, opacity: 0, scale: 0.97, filter: "blur(6px)" }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="rounded-[26px] bg-toast p-5 text-on-toast shadow-lift"
        >
          <div className="flex items-baseline gap-2.5">
            <span className="size-2 shrink-0 -translate-y-0.5 rounded-full" style={{ background: dot }} />
            <p className="font-[family-name:var(--font-hand)] text-[22px] leading-tight font-bold">{title}</p>
          </div>
          {body && <p className="mt-1.5 pl-[18px] text-[15px] leading-snug text-on-toast/75">{body}</p>}
          {(action || secondary) && <div className="mt-4 flex items-center gap-2 pl-[18px]">{action}{secondary}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const toastPill =
  "inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[15px] font-semibold text-[#0d0e0d] transition-transform active:scale-95";
export const toastQuiet =
  "inline-flex min-h-11 items-center rounded-full bg-white/12 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/20";
