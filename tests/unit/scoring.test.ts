import { describe, expect, it } from "vitest";
import {
  badgeVariantFor,
  computeOutcomeStats,
  levelForXp,
  outcomeForAttempt,
  speedMultiplier,
  totalXpForLevel,
  xpForCorrect,
  xpToAdvanceFromLevel,
  MAX_LEVEL,
} from "@/lib/game/scoring";

describe("xpForCorrect", () => {
  it("grants base + attempt bonus + combo bonus", () => {
    expect(xpForCorrect(1, 1)).toBe(10 + 10 + 2); // 22
    expect(xpForCorrect(1, 3)).toBe(10 + 10 + 6); // 26
    expect(xpForCorrect(2, 1)).toBe(10 + 5 + 2); // 17
    expect(xpForCorrect(3, 1)).toBe(10 + 2 + 2); // 14
  });

  it("caps the combo bonus at 10 (combo 5+)", () => {
    expect(xpForCorrect(1, 5)).toBe(10 + 10 + 10);
    expect(xpForCorrect(1, 12)).toBe(10 + 10 + 10);
  });

  it("throws on invalid attempt numbers", () => {
    expect(() => xpForCorrect(0 as never, 1)).toThrow(RangeError);
    expect(() => xpForCorrect(4 as never, 1)).toThrow(RangeError);
  });

  it("throws on invalid combo streaks", () => {
    expect(() => xpForCorrect(1, 0)).toThrow(RangeError);
    expect(() => xpForCorrect(1, -1)).toThrow(RangeError);
  });
});

describe("speedMultiplier", () => {
  it("is x1 below a 3-streak, x2 from 3, x3 from 6, capped at x3", () => {
    expect(speedMultiplier(0)).toBe(1);
    expect(speedMultiplier(1)).toBe(1);
    expect(speedMultiplier(2)).toBe(1);
    expect(speedMultiplier(3)).toBe(2);
    expect(speedMultiplier(5)).toBe(2);
    expect(speedMultiplier(6)).toBe(3);
    expect(speedMultiplier(50)).toBe(3);
  });

  it("throws on negative streaks", () => {
    expect(() => speedMultiplier(-1)).toThrow(RangeError);
  });
});

describe("levels", () => {
  it("level 1 starts at 0 XP with a 50-XP first advance", () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(xpToAdvanceFromLevel(1)).toBe(50);
    expect(levelForXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNext: 50, progress: 0 });
  });

  it("advances at exact thresholds", () => {
    expect(levelForXp(49).level).toBe(1);
    expect(levelForXp(50).level).toBe(2);
    expect(levelForXp(150).level).toBe(3); // 50 + 100
    expect(totalXpForLevel(3)).toBe(150);
  });

  it("reports progress inside a level", () => {
    const p = levelForXp(75); // 50 into level 2, which costs 100
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(25);
    expect(p.xpForNext).toBe(100);
    expect(p.progress).toBeCloseTo(0.25);
  });

  it("is monotonic and clamps at MAX_LEVEL", () => {
    let lastLevel = 0;
    for (let xp = 0; xp <= 100000; xp += 137) {
      const { level } = levelForXp(xp);
      expect(level).toBeGreaterThanOrEqual(lastLevel);
      lastLevel = level;
      expect(level).toBeLessThanOrEqual(MAX_LEVEL);
    }
    expect(levelForXp(Number.MAX_SAFE_INTEGER).level).toBe(MAX_LEVEL);
    expect(levelForXp(Number.MAX_SAFE_INTEGER).progress).toBe(1);
  });

  it("throws on invalid XP", () => {
    expect(() => levelForXp(-1)).toThrow(RangeError);
    expect(() => levelForXp(NaN)).toThrow(RangeError);
    expect(() => levelForXp(Infinity)).toThrow(RangeError);
  });
});

describe("outcomeForAttempt", () => {
  it("maps attempt numbers to outcomes", () => {
    expect(outcomeForAttempt(1, true)).toBe("correct-first");
    expect(outcomeForAttempt(2, true)).toBe("correct-second");
    expect(outcomeForAttempt(3, true)).toBe("correct-third");
  });

  it("throws for wrong answers (recorded via a different path)", () => {
    expect(() => outcomeForAttempt(1, false)).toThrow(RangeError);
  });
});

describe("badgeVariantFor", () => {
  it("preserves v1 colour coding", () => {
    expect(badgeVariantFor("correct-first")).toBe("primary"); // blue
    expect(badgeVariantFor("correct-second")).toBe("warning"); // yellow
    expect(badgeVariantFor("correct-third")).toBe("danger"); // red
    expect(badgeVariantFor("failed")).toBe("secondary"); // grey
    expect(badgeVariantFor("skipped")).toBe("secondary"); // grey
  });
});

describe("computeOutcomeStats", () => {
  it("returns zeros — never NaN — when nothing was answered (v1 regression)", () => {
    const stats = computeOutcomeStats({
      correctFirst: 0,
      correctSecond: 0,
      correctThird: 0,
      wrong: 0,
      skipped: 0,
    });
    expect(stats.total).toBe(0);
    expect(stats.accuracyPct).toBe(0);
    expect(stats.firstTryAccuracyPct).toBe(0);
    expect(Number.isNaN(stats.accuracyPct)).toBe(false);
  });

  it("computes percentages rounded to 2 decimals", () => {
    const stats = computeOutcomeStats({
      correctFirst: 6,
      correctSecond: 3,
      correctThird: 1,
      wrong: 0,
      skipped: 0,
    });
    expect(stats.total).toBe(10);
    expect(stats.accuracyPct).toBe(100);
    expect(stats.correctFirstPct).toBe(60);
    expect(stats.firstTryAccuracyPct).toBe(60);
  });

  it("handles skipped as answered-but-wrong", () => {
    const stats = computeOutcomeStats({
      correctFirst: 1,
      correctSecond: 0,
      correctThird: 0,
      wrong: 1,
      skipped: 2,
    });
    expect(stats.total).toBe(4);
    expect(stats.accuracyPct).toBe(25);
    expect(stats.skippedPct).toBe(50);
  });
});
