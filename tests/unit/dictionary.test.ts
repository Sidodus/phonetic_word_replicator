import { describe, expect, it, vi, afterEach } from "vitest";
import {
  clearPackCache,
  loadPack,
  PackValidationError,
  validatePack,
} from "@/lib/game/dictionary";

const goodPack = {
  meta: {
    lang: "en",
    version: 2,
    generatedAt: "2026-11-10",
    source: "test",
    count: 2,
    tiers: { starter: 2, core: 0, advanced: 0 },
  },
  entries: [
    { w: "cat", ipa: "kæt", xs: "k{t", tier: "starter" },
    { w: "dog", ipa: "dɒɡ", xs: "dQg", tier: "starter" },
  ],
};

describe("validatePack", () => {
  it("accepts a well-formed pack and recomputes tier counts", () => {
    const pack = validatePack(goodPack);
    expect(pack.entries).toHaveLength(2);
    expect(pack.meta.tiers.starter).toBe(2);
    expect(pack.meta.count).toBe(2);
  });

  it("reports every problem at once (not just the first)", () => {
    const bad = {
      meta: { lang: "xx", version: 1 },
      entries: [
        { w: "cat", ipa: "", xs: "k{t", tier: "starter" },
        { w: "dog", ipa: "dɒɡ", xs: "dQg", tier: "hard" },
        { w: "cat", ipa: "kæt", xs: "k{t", tier: "starter" }, // duplicate
      ],
    };
    try {
      validatePack(bad);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PackValidationError);
      const problems = (err as PackValidationError).problems;
      expect(problems.some((p) => p.includes("ipa"))).toBe(true);
      expect(problems.some((p) => p.includes("tier"))).toBe(true);
      expect(problems.some((p) => p.includes("duplicate"))).toBe(true);
      expect(problems.some((p) => p.includes("meta.lang"))).toBe(true);
      expect(problems.some((p) => p.includes("meta.version"))).toBe(false); // version not checked here
    }
  });

  it("rejects non-object roots and non-array entries", () => {
    expect(() => validatePack(null)).toThrow(PackValidationError);
    expect(() => validatePack([])).toThrow(PackValidationError);
    expect(() => validatePack({ meta: goodPack.meta, entries: "nope" })).toThrow(
      PackValidationError,
    );
  });
});

describe("loadPack", () => {
  afterEach(() => {
    clearPackCache();
    vi.unstubAllGlobals();
  });

  it("fetches, validates and memoizes packs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(goodPack), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const pack = await loadPack("en");
    expect(pack.entries).toHaveLength(2);
    const again = await loadPack("en");
    expect(again).toBe(pack); // memoized
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/dictionaries/en.json");
  });

  it("throws a descriptive error on HTTP failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );
    await expect(loadPack("fr")).rejects.toThrow(/HTTP 404/);
  });

  it("propagates pack validation failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ meta: {}, entries: [] }), { status: 200 })),
    );
    await expect(loadPack("de")).rejects.toBeInstanceOf(PackValidationError);
  });
});
