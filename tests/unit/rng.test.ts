import { describe, expect, it } from "vitest";
import {
  createRng,
  dateKey,
  hashSeed,
  mulberry32,
  parseDateKey,
  previousDateKey,
} from "@/lib/game/rng";

describe("hashSeed", () => {
  it("is deterministic for the same input", () => {
    expect(hashSeed("2026-11-10")).toBe(hashSeed("2026-11-10"));
  });

  it("differs for different inputs", () => {
    expect(hashSeed("2026-11-10")).not.toBe(hashSeed("2026-11-11"));
  });

  it("returns a 32-bit unsigned integer", () => {
    const seed = hashSeed("anything");
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
    expect(Number.isInteger(seed)).toBe(true);
  });
});

describe("mulberry32", () => {
  it("produces identical sequences for identical seeds", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0, 1)", () => {
    const next = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("createRng", () => {
  it("int() respects exclusive bounds", () => {
    const rng = createRng(1);
    for (let i = 0; i < 500; i++) {
      const value = rng.int(5);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(5);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("int() throws on invalid bounds", () => {
    const rng = createRng(1);
    expect(() => rng.int(0)).toThrow(RangeError);
    expect(() => rng.int(-1)).toThrow(RangeError);
    expect(() => rng.int(1.5)).toThrow(RangeError);
  });

  it("pick() returns elements from the array", () => {
    const rng = createRng(2);
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 50; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it("pick() throws on empty input", () => {
    const rng = createRng(2);
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it("shuffle() does not mutate the input and preserves elements", () => {
    const rng = createRng(3);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = [...input];
    const shuffled = rng.shuffle(input);
    expect(input).toEqual(copy);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(copy);
  });

  it("shuffle() with the same seed produces the same order", () => {
    expect(createRng("seed").shuffle([1, 2, 3, 4, 5])).toEqual(
      createRng("seed").shuffle([1, 2, 3, 4, 5]),
    );
  });

  it("same string seed + salt differs from no salt", () => {
    const a = createRng("2026-11-10").next();
    const b = createRng("2026-11-10", "en").next();
    expect(a).not.toBe(b);
  });
});

describe("dateKey / parseDateKey / previousDateKey", () => {
  it("formats with zero padding", () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dateKey(new Date(2026, 10, 10))).toBe("2026-11-10");
  });

  it("round-trips through parseDateKey", () => {
    const key = "2026-03-15";
    expect(dateKey(parseDateKey(key))).toBe(key);
  });

  it("throws on malformed keys", () => {
    expect(() => parseDateKey("2026/11/10")).toThrow(RangeError);
    expect(() => parseDateKey("not-a-date")).toThrow(RangeError);
  });

  it("crosses month and year boundaries correctly", () => {
    expect(previousDateKey("2026-03-01")).toBe("2026-02-28");
    expect(previousDateKey("2026-01-01")).toBe("2025-12-31");
    expect(previousDateKey("2028-03-01")).toBe("2028-02-29"); // leap year
  });

  it("is stable across timezones (local-noon anchors)", () => {
    // A UTC+13 reader and a UTC-11 reader must both map their local day
    // correctly: parseDateKey always yields local noon, never a boundary.
    const date = parseDateKey("2026-06-15");
    expect(date.getHours()).toBe(12);
    expect(date.getMinutes()).toBe(0);
  });
});
