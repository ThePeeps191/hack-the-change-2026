import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both load their own assets at runtime, so they stay out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  // Read from disk at runtime (starter quests, migrations), so Vercel has to ship them.
  outputFileTracingIncludes: { "/**": ["./data/**/*", "./db/migrations/*"] },
  experimental: {
    // The dev-only MCP server writes every request and browser log line to
    // .next/dev/logs/. In a git worktree (.claude/worktrees/) Turbopack counts
    // that write as a code change, so pages reload forever. We don't use it.
    mcpServer: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
