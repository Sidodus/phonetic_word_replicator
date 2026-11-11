import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

/**
 * Contract tests for the PWA layer: the service worker and manifest are plain
 * files in /public, so their invariants are checked as source content.
 */
describe("PWA layer", () => {
  const sw = fs.readFileSync(path.join(ROOT, "public/sw.js"), "utf8");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public/manifest.webmanifest"), "utf8"),
  ) as {
    name: string;
    start_url: string;
    scope: string;
    display: string;
    icons: { src: string; sizes: string; type: string }[];
  };

  it("service worker uses a versioned cache and cleans old caches", () => {
    expect(sw).toContain("pwr-sw-");
    expect(sw).toContain("caches.keys()");
    expect(sw).toContain("skipWaiting()");
    expect(sw).toContain("clients.claim()");
  });

  it("service worker covers the caching strategies", () => {
    expect(sw).toContain("request.mode === \"navigate\"");
    expect(sw).toContain("/_next/static/");
    expect(sw).toContain("/dictionaries/");
    expect(sw).toContain("/img/");
    expect(sw).toContain("request.method !== \"GET\"");
    expect(sw).toContain("url.origin !== self.location.origin");
  });

  it("manifest is installable-shaped with existing icons", () => {
    expect(manifest.name).toBe("Phonetic Word Replicator");
    expect(manifest.start_url).toBe("./");
    expect(manifest.scope).toBe("./");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      // Icons must exist on disk at the declared path.
      const iconPath = path.join(ROOT, "public/img", path.basename(icon.src));
      expect(fs.existsSync(iconPath), `missing icon ${icon.src}`).toBe(true);
      expect(icon.sizes).toMatch(/^\d+x\d+$/);
    }
  });

  it("layout registers the manifest with the base path", () => {
    const layout = fs.readFileSync(path.join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layout).toContain('withBasePath("/manifest.webmanifest")');
  });

  it("AppShell registers the service worker in production only", () => {
    const shell = fs.readFileSync(path.join(ROOT, "src/components/AppShell.tsx"), "utf8");
    expect(shell).toContain('withBasePath("/sw.js")');
    expect(shell).toContain('process.env.NODE_ENV !== "production"');
  });
});
