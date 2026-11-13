import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

/**
 * Contract tests for the CI quality-gate configs. The Lighthouse incident
 * (2026-11-12) shipped an invalid `resource-summary:script:size:document`
 * assertion key and a bytes-vs-KiB budget unit mistake — both passed review
 * because nothing validated the config. These tests make that impossible:
 * a malformed budget fails the same test suite as a broken engine.
 */

const VALID_ASSERTION =
  /^(categories:(performance|accessibility|best-practices|seo)|resource-summary:[a-z-]+:(size|count)|[a-z0-9-]+)$/;

describe("Lighthouse CI config (lighthouserc.json)", () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(ROOT, "lighthouserc.json"), "utf8"),
  ) as {
    ci: {
      collect: {
        startServerCommand: string;
        startServerReadyPattern?: string;
        url: string[];
        settings?: { preset?: string };
      };
      assert: { assertions: Record<string, unknown> };
    };
  };

  it("starts its own server and audits the three real pages", () => {
    // LHCI owns the `npm start` child (starts, waits for the ready pattern,
    // kills it) — agents must never manage that process themselves.
    expect(config.ci.collect.startServerCommand).toBe("npm start");
    expect(config.ci.collect.startServerReadyPattern).toContain("Accepting connections");
    expect(config.ci.collect.url).toEqual([
      "http://127.0.0.1:4173/",
      "http://127.0.0.1:4173/play/",
      "http://127.0.0.1:4173/stats/",
    ]);
  });

  it("never gates on the 404 pages", () => {
    // Next deliberately emits <meta name="robots" content="noindex"> on 404 —
    // correct behavior that the SEO category then fails. The 404 pages are out
    // of LHCI scope by design (2026-11-13 incident: seo 0.63 on /404.html).
    for (const url of config.ci.collect.url) {
      expect(url, `404 pages must stay out of the LHCI gate: ${url}`).not.toContain("404");
    }
  });

  it("uses the desktop preset", () => {
    expect(config.ci.collect.settings?.preset).toBe("desktop");
  });

  it("has valid assertion keys only", () => {
    const assertions = config.ci.assert.assertions;
    const keys = Object.keys(assertions);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key, `invalid LHCI assertion key: ${key}`).toMatch(VALID_ASSERTION);
    }
  });

  it("keeps resource-summary budgets in a sane byte range", () => {
    // resource-summary size budgets are BYTES (proven 2026-11-13: actual script
    // size reported as 166365 ≈ 163 KiB). A "300" budget meant 300 bytes, and a
    // "250000" interpreted as KiB would have meant 250 MB — both guarded here.
    for (const [key, value] of Object.entries(config.ci.assert.assertions)) {
      if (!key.startsWith("resource-summary:")) continue;
      const [, options] = value as [string, { maxNumericValue?: number }];
      expect(options.maxNumericValue).toBeGreaterThan(10_000);
      expect(options.maxNumericValue, `${key} budget should be byte-scale`).toBeLessThan(
        2_000_000,
      );
    }
  });

  it("keeps category gates at enterprise-grade floors", () => {
    const assertions = config.ci.assert.assertions;
    const minScore = (key: string) =>
      (assertions[key] as [string, { minScore: number }])[1].minScore;
    expect(minScore("categories:performance")).toBeGreaterThanOrEqual(0.85);
    expect(minScore("categories:accessibility")).toBeGreaterThanOrEqual(0.95);
    expect(minScore("categories:best-practices")).toBeGreaterThanOrEqual(0.9);
  });
});

describe("workflow configs", () => {
  const ci = fs.readFileSync(path.join(ROOT, ".github/workflows/ci.yml"), "utf8");
  const deploy = fs.readFileSync(path.join(ROOT, ".github/workflows/deploy.yml"), "utf8");

  it("CI runs lint, typecheck, tests, pack validation, build and E2E", () => {
    for (const step of [
      "npm run lint",
      "npm run typecheck",
      "npm run data:validate",
      "npm run test:coverage",
      "npm run build",
      "npx playwright test",
    ]) {
      expect(ci, `CI is missing step: ${step}`).toContain(step);
    }
  });

  it("CI Lighthouse job uses the committed config file", () => {
    expect(ci).toContain("@lhci/cli");
    expect(ci).toContain("--config=./lighthouserc.json");
  });

  it("CI builds the static export before the Lighthouse job", () => {
    const lighthouseJob = ci.slice(ci.indexOf("lighthouse:"));
    expect(lighthouseJob).toContain("npm run build");
    expect(lighthouseJob.indexOf("npm run build")).toBeLessThan(
      lighthouseJob.indexOf("@lhci/cli"),
    );
  });

  it("deploy workflow asserts the GitHub Pages base path is baked in", () => {
    // Regression guard for the sub-path deployment contract (AGENTS.md §10).
    expect(deploy).toContain("npm run build:pages");
    expect(deploy).toContain(
      "grep -q 'src=\"/phonetic_word_replicator/_next/static' out/index.html",
    );
  });

  it("workflows pin actions with v-prefixed version tags", () => {
    // MATCHMASTER lesson: action refs need the exact v-prefixed tag — @0.33.1
    // silently fails to resolve where @v0.33.1 works.
    const actionRefs = [...`${ci}\n${deploy}`.matchAll(/uses:\s*([\w./-]+)@([\w.-]+)/g)].map(
      (m) => m[2],
    );
    expect(actionRefs.length).toBeGreaterThan(0);
    for (const ref of actionRefs) {
      expect(ref, `action ref "${ref}" must be v-prefixed`).toMatch(/^v\d+/);
    }
  });
});
