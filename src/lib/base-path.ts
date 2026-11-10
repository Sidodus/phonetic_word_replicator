/**
 * Base-path handling for static hosting under a sub-path.
 *
 * GitHub Pages project sites serve the app at
 * `https://sidodus.github.io/phonetic_word_replicator/` — the repo name is part
 * of every URL. Builds for that target set NEXT_PUBLIC_BASE_PATH (via
 * `npm run build:pages`); local/Vercel builds leave it unset and everything
 * resolves from the domain root.
 *
 * Two layers are involved:
 *  - `next.config.ts` reads this env var into Next's `basePath`, which prefixes
 *    the emitted JS/CSS bundle URLs and router links.
 *  - Hand-written asset URLs and client-side `fetch()` calls must prefix
 *    themselves — use {@link withBasePath} for every absolute `/…` asset path.
 */

/** Build-time base path ("" for root deployments). */
export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefix an absolute asset path with the configured base path.
 * Idempotent: a path that already starts with the base path is returned
 * unchanged. Non-absolute paths (relative, protocol URLs) pass through.
 */
export function withBasePath(path: string, basePath: string = BASE_PATH): string {
  if (!basePath) {
    return path;
  }
  // Only rewrite site-absolute paths; leave //host, http(s), data:, etc. alone.
  if (!path.startsWith("/") || path.startsWith("//")) {
    return path;
  }
  // Idempotence guard (e.g. strings built in two places, both prefixed).
  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path;
  }
  return `${basePath}${path}`;
}
