import "server-only";

// Mock is the default so a fresh worktree runs with no keys or logins.
export const AUTH_MODE = process.env.AUTH_MODE === "live" ? "live" : "mock";
export const GEMINI_MODE = process.env.GEMINI_MODE === "live" ? "live" : "mock";
export const DEMO_MODE = process.env.DEMO_MODE === "1" || process.env.DEMO_MODE === "true";
