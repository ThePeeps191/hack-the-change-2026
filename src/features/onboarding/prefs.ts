import type { Prefs } from "@/lib/contracts";

// The comfort settings screen's shape, and how it maps onto the account.
export type Comfort = { pace: "stroll" | "walk" | "brisk"; talk: "side" | "chatty"; stepFree: boolean };

export function toComfort(p: Prefs): Comfort {
  return {
    pace: p.pace === "short" ? "stroll" : p.pace === "brisk" ? "brisk" : "walk",
    talk: p.social === "chatty" ? "chatty" : "side",
    stepFree: p.step_free === true,
  };
}

export function toPrefs(c: Comfort, language?: string): Prefs {
  return {
    pace: c.pace === "stroll" ? "short" : c.pace === "brisk" ? "brisk" : "any",
    social: c.talk === "chatty" ? "chatty" : "side-by-side",
    step_free: c.stepFree,
    ...(language ? { language } : {}),
  };
}
