import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean standalone server output for the Docker image (Dockerfile copies
  // only .next/standalone + .next/static + public, not full node_modules).
  output: "standalone",
  // Cache Components (PPR-style) forces every dynamic read (getServerSession,
  // new Date(), per-user fetch) into Suspense/"use cache" boundaries. This
  // app is entirely per-user and session-gated with no static content to
  // cache, so it's disabled rather than threading that boilerplate through
  // every page. See ledger Task 6.
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
