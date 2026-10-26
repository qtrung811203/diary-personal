import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
