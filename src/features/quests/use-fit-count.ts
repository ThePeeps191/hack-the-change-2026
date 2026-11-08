"use client";
import { type RefObject, useEffect, useState } from "react";

// How many quest cards to show in a list. On a phone it's always `min`, and the
// rest wait in the "more quests" dropdown. On a computer the list sits beside
// the sky, so it shows as many as fit before the bottom of the screen: it
// measures the room left under the column, adds or removes cards to fill it,
// and measures again until nothing changes.
export function useFitCount(list: RefObject<HTMLElement | null>, total: number, min = 3) {
  const [count, setCount] = useState(min);
  useEffect(() => {
    const fit = () => {
      const el = list.current;
      const column = el?.closest(".split-main");
      const first = el?.firstElementChild;
      if (!column || !first || !matchMedia("(min-width: 1024px)").matches) return setCount(min);
      const step = first.getBoundingClientRect().height + 10; // a card plus the gap
      const room = innerHeight - (column.getBoundingClientRect().bottom + scrollY);
      setCount(Math.max(min, Math.min(total, count + Math.floor(room / step))));
    };
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, [list, total, min, count]);
  return count;
}
