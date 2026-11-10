import type { NextConfig } from "next";

// Static export: the game is a fully client-side app (see docs/adr/0001-static-export.md).
// `npx serve out` (npm start) serves the generated site.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    // `next/image` optimization is unavailable in static exports.
    unoptimized: true,
  },
  // Trailing slashes make every page resolve as index.html on any static host.
  trailingSlash: true,
};

export default nextConfig;
