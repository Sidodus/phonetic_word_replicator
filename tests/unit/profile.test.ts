import { beforeEach, describe, expect, it } from "vitest";
import type { AttemptRecord } from "@/types/game";
import {
  createEmptyProfile,
  HISTORY_CAP,
  PROFILE_STORAGE_KEY,
  useProfileStore,
  achievementSnapshotOf,
} from "@/lib/storage/profile";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { dateKey } from "@/lib/game/rng";

function record(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    word: "cat",
    ipa: "kæt",
    xsampa: "k{t",
    tier: "starter",
    mode: "classic",
    outcome: "correct-first",
    attemptsUsed: 1,
    hintsUsed: 0,
    xpEarned: 22,
    answeredAt: Date.now(),
    ...overrides,
  };
}

function freshStore() {
  // Merge (NOT replace): the store's action functions live in state and must
  // survive between tests.
  useProfileStore.setState({ ...createEmptyProfile() });
  window.localStorage.clear();
}

describe("profile store", () => {
  beforeEach(freshStore);

  it("starts empty with all languages initialized", () => {
    const s = useProfileStore.getState();
    expect(s.xpTotal).toBe(0);
    expect(s.languageStats.en).toBeDefined();
    expect(s.languageStats.zh).toBeDefined();
    expect(s.history).toHaveLength(0);
  });

  describe("recordAttempt", () => {
    it("folds outcomes into per-language and global counters", () => {
      const s = useProfileStore.getState();
      s.recordAttempt("en", record());
      s.recordAttempt("en", record({ outcome: "correct-second", xpEarned: 17 }));
      s.recordAttempt("fr", record({ outcome: "failed", xpEarned: 0 }));

      const state = useProfileStore.getState();
      expect(state.languageStats.en.correctFirst).toBe(1);
      expect(state.languageStats.en.correctSecond).toBe(1);
      expect(state.languageStats.fr.wrong).toBe(1);
      expect(state.globalCounts.correctFirst).toBe(1);
      expect(state.globalCounts.wrong).toBe(1);
      expect(state.languagesPlayed).toEqual(["en", "fr"]);
    });

    it("accumulates XP globally and per language", () => {
      const s = useProfileStore.getState();
      s.recordAttempt("en", record({ xpEarned: 22 }));
      s.recordAttempt("en", record({ xpEarned: 22 }));
      const state = useProfileStore.getState();
      expect(state.xpTotal).toBe(44);
      expect(state.xpByLanguage.en).toBe(44);
    });

    it("prepends history and caps it", () => {
      for (let i = 0; i < HISTORY_CAP + 20; i++) {
        useProfileStore.getState().recordAttempt("en", record({ word: `w${i}` }));
      }
      const state = useProfileStore.getState();
      expect(state.history).toHaveLength(HISTORY_CAP);
      expect(state.history[0].word).toBe(`w${HISTORY_CAP + 19}`);
    });

    it("counts hint usage", () => {
      useProfileStore.getState().recordAttempt("en", record({ hintsUsed: 1 }));
      const state = useProfileStore.getState();
      expect(state.globalCounts.hintsUsed).toBe(1);
      expect(state.languageStats.en.hintsUsed).toBe(1);
    });
  });

  describe("endSession", () => {
    it("increments sessions and records best combo", () => {
      useProfileStore.getState().recordAttempt("en", record());
      const unlocked = useProfileStore.getState().endSession({
        mode: "classic",
        language: "en",
        records: [record()],
        xpEarned: 22,
        hintsUsed: 0,
        bestCombo: 5,
        speedScore: 0,
        startedAt: 1,
        endedAt: 2,
        questionsInSession: 1,
        correctFirstInSession: 1,
      });
      const state = useProfileStore.getState();
      expect(state.globalCounts.sessionsCompleted).toBe(1);
      expect(state.globalCounts.bestCombo).toBe(5);
      expect(state.languageStats.en.sessionsCompleted).toBe(1);
      expect(unlocked).toContain("combo-5");
      expect(state.lastPlayed).toEqual({ language: "en", mode: "classic" });
    });

    it("counts perfect sessions only for 10+ all-first-try rounds", () => {
      const records = Array.from({ length: 10 }, () => record());
      useProfileStore.getState().endSession({
        mode: "classic",
        language: "en",
        records,
        xpEarned: 220,
        hintsUsed: 0,
        bestCombo: 10,
        speedScore: 0,
        startedAt: 1,
        endedAt: 2,
        questionsInSession: 10,
        correctFirstInSession: 10,
      });
      expect(useProfileStore.getState().globalCounts.perfectSessions).toBe(1);
    });

    it("updates speed best per language", () => {
      useProfileStore.getState().endSession({
        mode: "speed",
        language: "en",
        records: [],
        xpEarned: 0,
        hintsUsed: 0,
        bestCombo: 3,
        speedScore: 150,
        startedAt: 1,
        endedAt: 2,
        questionsInSession: 10,
        correctFirstInSession: 10,
      });
      expect(useProfileStore.getState().bestSpeedScore.en).toBe(150);
      // A lower score does not replace it.
      useProfileStore.getState().endSession({
        mode: "speed",
        language: "en",
        records: [],
        xpEarned: 0,
        hintsUsed: 0,
        bestCombo: 1,
        speedScore: 90,
        startedAt: 3,
        endedAt: 4,
        questionsInSession: 5,
        correctFirstInSession: 5,
      });
      expect(useProfileStore.getState().bestSpeedScore.en).toBe(150);
    });

    it("records daily completions and advances the streak once per day", () => {
      const today = dateKey(new Date());
      const summary = {
        mode: "daily" as const,
        language: "en" as const,
        records: [record()],
        xpEarned: 22,
        hintsUsed: 0,
        bestCombo: 1,
        speedScore: 0,
        startedAt: 1,
        endedAt: 2,
        questionsInSession: 1,
        correctFirstInSession: 1,
      };
      useProfileStore.getState().endSession(summary, today);
      let state = useProfileStore.getState();
      expect(state.streak.current).toBe(1);
      expect(state.dailyCalendar[today]).toBeDefined();

      // Same-day completion does not advance the streak or duplicate the entry.
      useProfileStore.getState().endSession(summary, today);
      state = useProfileStore.getState();
      expect(state.streak.current).toBe(1);
      expect(Object.keys(state.dailyCalendar)).toHaveLength(1);
    });

    it("unlocks each achievement exactly once", () => {
      const summary = {
        mode: "classic" as const,
        language: "en" as const,
        records: [record()],
        xpEarned: 22,
        hintsUsed: 0,
        bestCombo: 6,
        speedScore: 0,
        startedAt: 1,
        endedAt: 2,
        questionsInSession: 1,
        correctFirstInSession: 1,
      };
      const first = useProfileStore.getState().endSession(summary);
      expect(first).toContain("combo-5");
      const second = useProfileStore.getState().endSession(summary);
      expect(second).not.toContain("combo-5");
      const state = useProfileStore.getState();
      expect(state.achievements["combo-5"]).toBeDefined();
    });

    it("keeps history XP consistent with the sum of records", () => {
      useProfileStore.getState().recordAttempt("en", record({ xpEarned: 22 }));
      useProfileStore.getState().recordAttempt("en", record({ xpEarned: 17, outcome: "correct-second", attemptsUsed: 2 }));
      const state = useProfileStore.getState();
      const sum = state.history.reduce((acc, r) => acc + r.xpEarned, 0);
      expect(state.xpTotal).toBe(sum);
    });
  });

  describe("resetProfile", () => {
    it("wipes progress but keeps settings", () => {
      useProfileStore.getState().updateSettings({ standard: "X-SAMPA", soundEnabled: false });
      useProfileStore.getState().recordAttempt("en", record());
      useProfileStore.getState().resetProfile();
      const state = useProfileStore.getState();
      expect(state.xpTotal).toBe(0);
      expect(state.history).toHaveLength(0);
      expect(state.settings.standard).toBe("X-SAMPA");
      expect(state.settings.soundEnabled).toBe(false);
    });
  });

  describe("importV1", () => {
    it("folds legacy counters into the profile exactly once", () => {
      window.localStorage.setItem("Correct Word On 1st Attempt", "4");
      window.localStorage.setItem("Wrong Word(es)", "2");
      const result = useProfileStore.getState().importV1();
      expect(result.imported).toBe(true);
      const state = useProfileStore.getState();
      expect(state.languageStats.en.correctFirst).toBe(4);
      expect(state.languageStats.es.wrong).toBe(2);
      expect(state.v1ImportedAt).not.toBeNull();

      // Second run is a no-op.
      const again = useProfileStore.getState().importV1();
      expect(again.imported).toBe(false);
      expect(useProfileStore.getState().languageStats.en.correctFirst).toBe(4);
    });

    it("imports history only when v2 history is empty", () => {
      window.localStorage.setItem(
        "All Attempted Questions",
        JSON.stringify([
          { previousWord: "cat", previousIpa: "/kæt/", previousXSampa: "/k{t/", className: "bg-primary" },
        ]),
      );
      useProfileStore.getState().importV1();
      expect(useProfileStore.getState().history).toHaveLength(1);

      useProfileStore.getState().recordAttempt("en", record({ word: "dog" }));
      useProfileStore.setState({ v1ImportedAt: null }, false);
      useProfileStore.getState().importV1();
      const history = useProfileStore.getState().history;
      // The v1 record is NOT merged a second time: "cat" appears once.
      expect(history.filter((r) => r.word === "cat")).toHaveLength(1);
      expect(history.some((r) => r.word === "dog")).toBe(true);
    });

    it("marks the migration done even when the legacy store is empty", () => {
      const result = useProfileStore.getState().importV1();
      expect(result.imported).toBe(false);
      expect(useProfileStore.getState().v1ImportedAt).not.toBeNull();
    });
  });

  describe("achievementSnapshotOf", () => {
    it("computes first-try accuracy and totals NaN-free", () => {
      const snap = achievementSnapshotOf(createEmptyProfile());
      expect(snap.answeredTotal).toBe(0);
      expect(snap.firstTryAccuracyPct).toBe(0);
      expect(snap.correctTotal).toBe(0);
      expect(Number.isNaN(snap.firstTryAccuracyPct)).toBe(false);
    });

    it("sees speed best across languages", () => {
      useProfileStore.getState().endSession({
        mode: "speed",
        language: "zh",
        records: [],
        xpEarned: 0,
        hintsUsed: 0,
        bestCombo: 1,
        speedScore: 310,
        startedAt: 1,
        endedAt: 2,
        questionsInSession: 3,
        correctFirstInSession: 3,
      });
      const snap = achievementSnapshotOf(useProfileStore.getState());
      expect(snap.speedBest).toBe(310);
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    });
  });

  it("persists under the v2 storage key with the right shape", () => {
    useProfileStore.getState().recordAttempt("en", record());
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { state?: { version?: number } };
    expect(parsed.state?.version).toBe(2);
  });
});
