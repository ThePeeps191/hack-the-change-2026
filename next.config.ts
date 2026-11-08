import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both load their own assets at runtime, so they stay out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  // Read from disk at runtime (starter quests, migrations), so Vercel has to ship them.
  outputFileTracingIncludes: { "/**": ["./data/**/*", "./db/migrations/*"] },
  // The service worker must never be served from a stale cache, or phones keep running an old one.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
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
