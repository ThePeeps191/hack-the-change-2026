"use client";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

// A frosted card that drops in over the sky, like a real push: a title, a
// line of detail, one solid pill action and a quiet one beside it.
export function Toast({
  show,
  title,
  body,
  action,
  secondary,
}: {
  show: boolean;
  title: ReactNode;
  body?: ReactNode;
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
          className="rounded-[26px] bg-white/85 p-5 text-[#121412] shadow-[0_18px_50px_rgb(13_40_90/0.25),inset_0_1px_0_rgb(255_255_255/0.9)] ring-1 ring-white/60 backdrop-blur-2xl dark:bg-[#1b2130]/85 dark:text-white dark:ring-white/10"
        >
          <p className="font-[family-name:var(--font-hand)] text-[22px] leading-tight font-bold">{title}</p>
          {body && <p className="mt-1.5 text-[15px] leading-snug opacity-70">{body}</p>}
          {(action || secondary) && <div className="mt-4 flex items-center gap-2">{action}{secondary}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const toastPill =
  "inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-accent px-5 text-[16px] font-semibold text-white dark:text-[#07102a] shadow-press transition-transform active:scale-95";
export const toastQuiet =
  "inline-flex min-h-12 items-center rounded-full px-5 text-[16px] font-semibold opacity-70 transition-opacity hover:opacity-100";
