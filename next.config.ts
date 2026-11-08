import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both load their own assets at runtime, so they stay out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  // Read from disk at runtime (starter quests, migrations), so Vercel has to ship them.
  outputFileTracingIncludes: { "/**": ["./data/**/*", "./db/migrations/*"] },
  turbopack: {
    // Worktrees live inside the main checkout (.claude/worktrees/), so Turbopack
    // could take the outer folder as the root and stop ignoring this checkout's
    // .next/. Its dev log then counts as a code change, and pages reload forever.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
