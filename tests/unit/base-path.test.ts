import { describe, expect, it } from "vitest";
import { BASE_PATH, withBasePath } from "@/lib/base-path";

describe("withBasePath", () => {
  it("returns paths unchanged when no base path is configured", () => {
    expect(withBasePath("/img/logo.png", "")).toBe("/img/logo.png");
    expect(withBasePath("/dictionaries/en.json", "")).toBe("/dictionaries/en.json");
  });

  it("prefixes site-absolute paths with the base path", () => {
    expect(withBasePath("/img/logo.png", "/phonetic_word_replicator")).toBe(
      "/phonetic_word_replicator/img/logo.png",
    );
    expect(withBasePath("/dictionaries/en.json", "/phonetic_word_replicator")).toBe(
      "/phonetic_word_replicator/dictionaries/en.json",
    );
  });

  it("never double-prefixes or rewrites external URLs", () => {
    const base = "/phonetic_word_replicator";
    // Already prefixed → idempotent
    expect(withBasePath(`${base}/img/logo.png`, base)).toBe(`${base}/img/logo.png`);
    expect(withBasePath(base, base)).toBe(base);
    // External / protocol-relative URLs pass through
    expect(withBasePath("https://en.wiktionary.org/wiki/cat", base)).toBe(
      "https://en.wiktionary.org/wiki/cat",
    );
    expect(withBasePath("//cdn.example.com/x.js", base)).toBe("//cdn.example.com/x.js");
    // Relative paths pass through
    expect(withBasePath("img/local.png", base)).toBe("img/local.png");
  });

  it("defaults to the module-level BASE_PATH (build-time env)", () => {
    // In unit tests no env var is set, so the default must be "" — production
    // builds for GitHub Pages inject it via npm run build:pages.
    expect(BASE_PATH).toBe("");
    expect(withBasePath("/x")).toBe("/x");
  });
});
