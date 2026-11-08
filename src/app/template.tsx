"use client";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Every navigation arrives with a short motion blur that resolves into focus.
// The starting style is the same on server and client (so hydration matches);
// with reduced motion the change is simply instant. MotionConfig makes every
// animation inside follow the phone's Reduce Motion setting: things still fade,
// but nothing slides, scales or springs.
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none", transform: "none" } }}
        transition={reduce ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
