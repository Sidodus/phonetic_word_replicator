#!/usr/bin/env node
/**
 * GitHub Pages build: exports the static site with NEXT_PUBLIC_BASE_PATH set
 * so every internal URL carries the /phonetic_word_replicator prefix.
 *
 * Why a wrapper script instead of `VAR=x next build` in the npm script:
 * npm runs scripts through cmd.exe on Windows, which doesn't understand POSIX
 * `VAR=value` env syntax — this keeps `npm run build:pages` cross-platform.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BASE = "/phonetic_word_replicator";
console.log(`Building static export with NEXT_PUBLIC_BASE_PATH=${BASE} …`);

const result = spawnSync("npx", ["next", "build"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: BASE },
});

process.exitCode = result.status ?? 1;
