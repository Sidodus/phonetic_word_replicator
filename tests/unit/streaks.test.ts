import { describe, expect, it } from "vitest";
import { applyDailyCompletion, isConsecutiveDay } from "@/lib/game/streaks";

describe("applyDailyCompletion", () => {
  it("keeps the streak unchanged when completing twice on the same day", () => {
    const result = applyDailyCompletion("2026-11-10", 4, "2026-11-10");
    expect(result).toEqual({ current: 4, longest: 4, isNewToday: false });
  });

  it("extends the streak on the following day", () => {
    const result = applyDailyCompletion("2026-11-09", 4, "2026-11-10");
    expect(result).toEqual({ current: 5, longest: 5, isNewToday: true });
  });

  it("resets to 1 after a skipped day", () => {
    const result = applyDailyCompletion("2026-11-07", 9, "2026-11-10");
    expect(result).toEqual({ current: 1, longest: 9, isNewToday: true });
  });

  it("starts at 1 with no history", () => {
    const result = applyDailyCompletion(null, 0, "2026-11-10");
    expect(result).toEqual({ current: 1, longest: 1, isNewToday: true });
  });

  it("extends across month boundaries", () => {
    expect(applyDailyCompletion("2026-10-31", 3, "2026-11-01").current).toBe(4);
  });

  it("extends across year boundaries", () => {
    expect(applyDailyCompletion("2025-12-31", 10, "2026-01-01").current).toBe(11);
  });

  it("never decreases longest", () => {
    const result = applyDailyCompletion("2026-11-01", 20, "2026-11-10");
    expect(result.longest).toBe(20);
    expect(result.current).toBe(1);
  });

  it("throws on invalid streaks", () => {
    expect(() => applyDailyCompletion(null, -1, "2026-11-10")).toThrow(RangeError);
  });
});

describe("isConsecutiveDay", () => {
  it("accepts strictly consecutive days", () => {
    expect(isConsecutiveDay("2026-11-09", "2026-11-10")).toBe(true);
    expect(isConsecutiveDay("2026-02-28", "2026-03-01")).toBe(true);
  });

  it("rejects same day and gaps", () => {
    expect(isConsecutiveDay("2026-11-10", "2026-11-10")).toBe(false);
    expect(isConsecutiveDay("2026-11-01", "2026-11-10")).toBe(false);
  });
});
