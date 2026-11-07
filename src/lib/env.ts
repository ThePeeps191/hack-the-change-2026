import "server-only";
import { secret } from "./secrets";

// Mock is the default so a fresh worktree runs with no keys or logins.
export const AUTH_MODE = process.env.AUTH_MODE === "live" ? "live" : "mock";
// AI_MODE=live makes real model calls. GEMINI_MODE is the old name and still works.
export const AI_MODE = (process.env.AI_MODE || process.env.GEMINI_MODE) === "live" ? "live" : "mock";
// Which model does the work when AI_MODE=live. Set AI_PROVIDER=gemini or
// AI_PROVIDER=claude to choose. Unset, it's Claude when there's an Anthropic key
// and Gemini when there's only a Gemini key. Keys in .env beat the shell.
export const AI_PROVIDER: "claude" | "gemini" =
  process.env.AI_PROVIDER === "gemini" || process.env.AI_PROVIDER === "claude"
    ? process.env.AI_PROVIDER
    : !secret("ANTHROPIC_API_KEY").value && secret("GEMINI_API_KEY").value
      ? "gemini"
      : "claude";
export const DEMO_MODE = process.env.DEMO_MODE === "1" || process.env.DEMO_MODE === "true";
