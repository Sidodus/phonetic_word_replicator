import type { NextConfig } from "next";

// Static export: the game is a fully client-side app (see docs/adr/0001-static-export.md).
// `npx serve out` (npm start) serves the generated site.
//
// NEXT_PUBLIC_BASE_PATH (set by `npm run build:pages`) makes Next prefix bundle
// URLs and router links for sub-path hosts like GitHub Pages project sites
// (https://sidodus.github.io/phonetic_word_replicator/). Unset locally, the
// app lives at the domain root. Hand-written asset URLs additionally use
// withBasePath() from src/lib/base-path.ts.
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: {
    // `next/image` optimization is unavailable in static exports.
    unoptimized: true,
  },
  // Trailing slashes make every page resolve as index.html on any static host.
  trailingSlash: true,
};

export default nextConfig;
