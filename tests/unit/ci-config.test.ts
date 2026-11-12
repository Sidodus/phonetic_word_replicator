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
      collect: { staticDistDir: string; settings?: { preset?: string } };
      assert: { assertions: Record<string, unknown> };
    };
  };

  it("collects from the static export directory", () => {
    expect(config.ci.collect.staticDistDir).toBe("./out");
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

  it("keeps resource-summary budgets in a sane KiB range", () => {
    // resource-summary sizes are reported in KiB. A budget like 250000 would
    // silently mean 250 MB — the exact unit mistake this guards against.
    for (const [key, value] of Object.entries(config.ci.assert.assertions)) {
      if (!key.startsWith("resource-summary:")) continue;
      const [, options] = value as [string, { maxNumericValue?: number }];
      expect(options.maxNumericValue).toBeGreaterThan(0);
      expect(options.maxNumericValue, `${key} budget should be KiB-scale`).toBeLessThan(2000);
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
