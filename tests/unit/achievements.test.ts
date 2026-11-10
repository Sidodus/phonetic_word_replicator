import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  emptyAchievementSnapshot,
} from "@/lib/game/achievements";
import { GAME_LANGUAGES } from "@/types/game";

function snapshot(overrides: Partial<ReturnType<typeof emptyAchievementSnapshot>> = {}) {
  return { ...emptyAchievementSnapshot(), ...overrides };
}

describe("ACHIEVEMENTS registry", () => {
  it("defines 16 unique achievements with i18n keys", () => {
    expect(ACHIEVEMENTS).toHaveLength(16);
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    expect(ids.size).toBe(16);
  });
});

describe("evaluateAchievements", () => {
  it("returns nothing for an empty snapshot", () => {
    expect(evaluateAchievements(snapshot())).toEqual([]);
  });

  it("unlocks first-word on the first correct answer", () => {
    expect(evaluateAchievements(snapshot({ correctTotal: 1 }))).toContain("first-word");
  });

  it("unlocks word-count milestones", () => {
    expect(evaluateAchievements(snapshot({ correctTotal: 49 }))).not.toContain("words-50");
    expect(evaluateAchievements(snapshot({ correctTotal: 50 }))).toContain("words-50");
    expect(evaluateAchievements(snapshot({ correctTotal: 250 }))).toContain("words-250");
    expect(evaluateAchievements(snapshot({ correctTotal: 1000 }))).toContain("words-1000");
  });

  it("unlocks combo milestones from best combo", () => {
    expect(evaluateAchievements(snapshot({ bestCombo: 4 }))).not.toContain("combo-5");
    expect(evaluateAchievements(snapshot({ bestCombo: 5 }))).toContain("combo-5");
    expect(evaluateAchievements(snapshot({ bestCombo: 12 }))).toContain("combo-12");
  });

  it("considers the current session's speed score", () => {
    const base = snapshot({ speedBest: 100 });
    expect(evaluateAchievements(base)).not.toContain("speed-150");
    expect(
      evaluateAchievements(base, { mode: "speed", speedScore: 160, questionsInSession: 5, correctFirstInSession: 5 }),
    ).toContain("speed-150");
  });

  it("unlocks daily streak milestones from the longest streak", () => {
    expect(evaluateAchievements(snapshot({ dailyStreak: 3 }))).toContain("streak-3");
    expect(evaluateAchievements(snapshot({ dailyStreak: 6 }))).not.toContain("streak-7");
    expect(evaluateAchievements(snapshot({ dailyStreak: 30 }))).toContain("streak-30");
  });

  it("unlocks polyglot only when all 8 languages have been played", () => {
    const six = snapshot({ languagesPlayed: GAME_LANGUAGES.slice(0, 6) });
    expect(evaluateAchievements(six)).not.toContain("polyglot");
    const all = snapshot({ languagesPlayed: [...GAME_LANGUAGES] });
    expect(evaluateAchievements(all)).toContain("polyglot");
  });

  it("unlocks listener after a completed listen round", () => {
    expect(evaluateAchievements(snapshot({ listenRoundsCompleted: 1 }))).toContain("listener");
  });

  it("unlocks level-10 at the XP threshold", () => {
    // Level 10 = 50*9*10/2 = 2250 XP.
    expect(evaluateAchievements(snapshot({ xpTotal: 2249 }))).not.toContain("level-10");
    expect(evaluateAchievements(snapshot({ xpTotal: 2250 }))).toContain("level-10");
  });

  it("unlocks sharpshooter only with 50+ answers AND 80%+ first-try", () => {
    expect(
      evaluateAchievements(snapshot({ answeredTotal: 49, firstTryAccuracyPct: 100 })),
    ).not.toContain("sharpshooter");
    expect(
      evaluateAchievements(snapshot({ answeredTotal: 50, firstTryAccuracyPct: 79.9 })),
    ).not.toContain("sharpshooter");
    expect(
      evaluateAchievements(snapshot({ answeredTotal: 50, firstTryAccuracyPct: 80 })),
    ).toContain("sharpshooter");
  });

  it("unlocks perfect-session from session context (10+ all first-try)", () => {
    const base = snapshot();
    const context = {
      mode: "classic",
      speedScore: 0,
      questionsInSession: 10,
      correctFirstInSession: 10,
    };
    expect(evaluateAchievements(base, context)).toContain("perfect-session");
    // 9 questions is not enough
    expect(evaluateAchievements(base, { ...context, questionsInSession: 9, correctFirstInSession: 9 })).not.toContain(
      "perfect-session",
    );
    // 10 questions but one miss is not enough
    expect(
      evaluateAchievements(base, { ...context, correctFirstInSession: 9 }),
    ).not.toContain("perfect-session");
  });

  it("is idempotent — same inputs, same output", () => {
    const s = snapshot({ correctTotal: 60, bestCombo: 6 });
    expect(evaluateAchievements(s)).toEqual(evaluateAchievements(s));
  });
});
