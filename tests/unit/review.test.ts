import { describe, expect, it } from "vitest";
import type { AttemptOutcome } from "@/types/game";
import {
  applyReviewResult,
  countDueReview,
  countTrackedReview,
  dueReviewEntries,
  evictToCap,
  intervalHoursForBox,
  isReviewDue,
  MAX_REVIEW_ENTRIES,
  REVIEW_BOXES,
  REVIEW_INTERVALS_HOURS,
  reviewKey,
  ReviewWordError,
  type ReviewBank,
} from "@/lib/game/review";

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;

describe("review schedule", () => {
  it("defines ascending spacing intervals", () => {
    expect(REVIEW_INTERVALS_HOURS).toHaveLength(REVIEW_BOXES);
    for (let i = 1; i < REVIEW_BOXES; i++) {
      expect(REVIEW_INTERVALS_HOURS[i]).toBeGreaterThan(REVIEW_INTERVALS_HOURS[i - 1]);
    }
    expect(intervalHoursForBox(0)).toBe(1);
    expect(intervalHoursForBox(4)).toBe(336);
  });

  it("throws on invalid boxes", () => {
    expect(() => intervalHoursForBox(-1)).toThrow(RangeError);
    expect(() => intervalHoursForBox(REVIEW_BOXES)).toThrow(RangeError);
    expect(() => intervalHoursForBox(1.5)).toThrow(RangeError);
  });

  it("marks entries due once their interval has passed", () => {
    const entry = { word: "cat", box: 1, lastSeen: NOW, lastOutcome: "correct-first" as AttemptOutcome };
    expect(isReviewDue(entry, NOW + 23 * HOUR)).toBe(false); // box 1 = 24h
    expect(isReviewDue(entry, NOW + 24 * HOUR)).toBe(true);
  });

  it("box 0 becomes due again after 1 hour", () => {
    const entry = { word: "dog", box: 0, lastSeen: NOW, lastOutcome: "failed" as AttemptOutcome };
    expect(isReviewDue(entry, NOW + 59 * 60_000)).toBe(false);
    expect(isReviewDue(entry, NOW + HOUR)).toBe(true);
  });
});

describe("applyReviewResult", () => {
  it("promotes on a first-try correct", () => {
    let bank = applyReviewResult({}, "en", "Cat", "correct-first", NOW);
    const entry = bank[reviewKey("en", "cat")];
    expect(entry).toMatchObject({ word: "Cat", box: 1, lastOutcome: "correct-first" });
    bank = applyReviewResult(bank, "en", "cat", "correct-first", NOW);
    expect(bank[reviewKey("en", "cat")].box).toBe(2);
  });

  it("holds the box on slower corrects", () => {
    let bank = applyReviewResult({}, "en", "cat", "correct-first", NOW); // box 1
    bank = applyReviewResult(bank, "en", "cat", "correct-second", NOW);
    expect(bank[reviewKey("en", "cat")].box).toBe(1);
    bank = applyReviewResult(bank, "en", "cat", "correct-third", NOW);
    expect(bank[reviewKey("en", "cat")].box).toBe(1);
  });

  it("resets to box 0 on failed and skipped", () => {
    let bank = applyReviewResult({}, "en", "cat", "correct-first", NOW);
    bank = applyReviewResult(bank, "en", "cat", "correct-first", NOW); // box 2
    bank = applyReviewResult(bank, "en", "cat", "failed", NOW);
    expect(bank[reviewKey("en", "cat")].box).toBe(0);
    bank = applyReviewResult(bank, "en", "cat", "correct-first", NOW); // box 1
    bank = applyReviewResult(bank, "en", "cat", "skipped", NOW);
    expect(bank[reviewKey("en", "cat")].box).toBe(0);
  });

  it("caps promotion at the top box (graduation stay)", () => {
    let bank: ReviewBank = {};
    for (let i = 0; i < 10; i++) {
      bank = applyReviewResult(bank, "en", "cat", "correct-first", NOW + i);
    }
    expect(bank[reviewKey("en", "cat")].box).toBe(REVIEW_BOXES - 1);
  });

  it("keys case-insensitively but preserves display casing", () => {
    const bank = applyReviewResult({}, "de", "Haus", "failed", NOW);
    expect(bank[reviewKey("de", "haus")].word).toBe("Haus");
    expect(bank[reviewKey("de", "HAUS")].word).toBe("Haus");
  });

  it("keeps languages separate", () => {
    const bank = applyReviewResult({}, "en", "cat", "failed", NOW);
    expect(countTrackedReview(bank, "fr")).toBe(0);
    expect(countTrackedReview(bank, "en")).toBe(1);
  });

  it("throws on empty words", () => {
    expect(() => applyReviewResult({}, "en", "  ", "failed", NOW)).toThrow(ReviewWordError);
  });
});

describe("due entries and counts", () => {
  it("returns only due entries, neediest first", () => {
    let bank = applyReviewResult({}, "en", "zebra", "failed", NOW); // box 0, due in 1h
    bank = applyReviewResult(bank, "en", "apple", "correct-first", NOW); // box 1
    bank = applyReviewResult(bank, "en", "mango", "correct-first", NOW); // box 1
    // Just after the failures: nothing due yet.
    expect(countDueReview(bank, "en", NOW + 30 * 60_000)).toBe(0);
    // After an hour: zebra (box 0) due.
    const at1h = dueReviewEntries(bank, "en", NOW + HOUR + 1);
    expect(at1h.map((e) => e.word)).toEqual(["zebra"]);
    // After a day: apple/mango (box 1, 24h) also due; neediest first ordering.
    const at25h = dueReviewEntries(bank, "en", NOW + 25 * HOUR);
    expect(at25h.map((e) => e.word)).toEqual(["zebra", "apple", "mango"]);
    expect(countDueReview(bank, "en", NOW + 25 * HOUR)).toBe(3);
  });

  it("sorts equal-box entries by oldest lastSeen", () => {
    let bank = applyReviewResult({}, "en", "aaa", "failed", NOW);
    bank = applyReviewResult(bank, "en", "bbb", "failed", NOW + HOUR); // still box 0, later
    const due = dueReviewEntries(bank, "en", NOW + 2 * HOUR);
    expect(due.map((e) => e.word)).toEqual(["aaa", "bbb"]);
  });
});

describe("evictToCap", () => {
  function makeBank(size: number, box = 2): Record<string, { word: string; box: number; lastSeen: number; lastOutcome: AttemptOutcome }> {
    const bank: Record<string, { word: string; box: number; lastSeen: number; lastOutcome: AttemptOutcome }> = {};
    for (let i = 0; i < size; i++) {
      bank[reviewKey("en", `w${String(i).padStart(4, "0")}`)] = {
        word: `w${String(i).padStart(4, "0")}`,
        box,
        lastSeen: NOW + i,
        lastOutcome: "correct-first",
      };
    }
    return bank;
  }

  it("returns the same bank under the cap", () => {
    const bank = makeBank(10);
    expect(evictToCap(bank)).toBe(bank);
  });

  it("evicts healthiest (highest box) first, then stalest", () => {
    const bank = makeBank(MAX_REVIEW_ENTRIES + 50, 3);
    const kept = evictToCap(bank);
    expect(Object.keys(kept)).toHaveLength(MAX_REVIEW_ENTRIES);
    // All evicted ones were the earliest-added (stalest) of the equal boxes.
    for (let i = 0; i < 50; i++) {
      expect(kept[reviewKey("en", `w${String(i).padStart(4, "0")}`)]).toBeUndefined();
    }
    // Late additions survive (keys are 4-digit padded by makeBank).
    expect(
      kept[reviewKey("en", `w${String(MAX_REVIEW_ENTRIES + 49).padStart(4, "0")}`)],
    ).toBeDefined();
  });

  it("prefers keeping low boxes over recency", () => {
    const bank = makeBank(MAX_REVIEW_ENTRIES, 4); // all healthy
    // One struggling word added last (most recent) — must survive eviction.
    const withStruggler = applyReviewResult(bank, "en", "struggler", "failed", NOW + 999999);
    const kept = evictToCap(withStruggler);
    expect(kept[reviewKey("en", "struggler")]).toBeDefined();
    expect(Object.keys(kept)).toHaveLength(MAX_REVIEW_ENTRIES);
  });
});
