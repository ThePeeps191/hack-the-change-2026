import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both load their own assets at runtime, so they stay out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
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
