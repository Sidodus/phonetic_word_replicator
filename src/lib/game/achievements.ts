/**
 * Achievement definitions and evaluation.
 *
 * Evaluation is a pure function of a profile snapshot: given the same stats it
 * always returns the same newly-unlocked ids, so unlocks are idempotent and
 * trivially testable.
 */

import { GAME_LANGUAGES, type LanguageCode } from "@/types/game";
import { levelForXp } from "./scoring";

export interface AchievementDef {
  id: string;
  icon: string;
  /** i18n keys: `achievements.<id>.name` / `.description`. */
  i18nKey: string;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: "first-word", icon: "🎯", i18nKey: "first-word" },
  { id: "words-50", icon: "📗", i18nKey: "words-50" },
  { id: "words-250", icon: "📚", i18nKey: "words-250" },
  { id: "words-1000", icon: "🏆", i18nKey: "words-1000" },
  { id: "perfect-session", icon: "💎", i18nKey: "perfect-session" },
  { id: "combo-5", icon: "🔥", i18nKey: "combo-5" },
  { id: "combo-12", icon: "🌋", i18nKey: "combo-12" },
  { id: "speed-150", icon: "⚡", i18nKey: "speed-150" },
  { id: "speed-300", icon: "🚀", i18nKey: "speed-300" },
  { id: "streak-3", icon: "📅", i18nKey: "streak-3" },
  { id: "streak-7", icon: "🗓️", i18nKey: "streak-7" },
  { id: "streak-30", icon: "🏅", i18nKey: "streak-30" },
  { id: "polyglot", icon: "🌍", i18nKey: "polyglot" },
  { id: "listener", icon: "🎧", i18nKey: "listener" },
  { id: "level-10", icon: "🎖️", i18nKey: "level-10" },
  { id: "sharpshooter", icon: "🪄", i18nKey: "sharpshooter" },
] as const;

export const ACHIEVEMENT_IDS: ReadonlySet<string> = new Set(ACHIEVEMENTS.map((a) => a.id));

/** The slice of profile state achievements are computed from. */
export interface AchievementSnapshot {
  xpTotal: number;
  correctTotal: number;
  bestCombo: number;
  perfectSessions: number;
  speedBest: number;
  dailyStreak: number;
  languagesPlayed: readonly LanguageCode[];
  listenRoundsCompleted: number;
  answeredTotal: number;
  firstTryAccuracyPct: number;
}

/** Context of the session currently ending (optional inputs for evaluation). */
export interface SessionAchievementContext {
  mode: string;
  speedScore: number;
  questionsInSession: number;
  correctFirstInSession: number;
}

export function emptyAchievementSnapshot(): AchievementSnapshot {
  return {
    xpTotal: 0,
    correctTotal: 0,
    bestCombo: 0,
    perfectSessions: 0,
    speedBest: 0,
    dailyStreak: 0,
    languagesPlayed: [],
    listenRoundsCompleted: 0,
    answeredTotal: 0,
    firstTryAccuracyPct: 0,
  };
}

/**
 * Return the ids from `candidates` that should newly unlock given the snapshot.
 * Idempotent: re-evaluating with the same inputs yields the same result.
 */
export function evaluateAchievements(
  snapshot: AchievementSnapshot,
  session?: SessionAchievementContext,
): string[] {
  const unlocked: string[] = [];

  const push = (id: string, condition: boolean) => {
    if (condition) unlocked.push(id);
  };

  push("first-word", snapshot.correctTotal >= 1);
  push("words-50", snapshot.correctTotal >= 50);
  push("words-250", snapshot.correctTotal >= 250);
  push("words-1000", snapshot.correctTotal >= 1000);
  push(
    "perfect-session",
    snapshot.perfectSessions >= 1 ||
      (session !== undefined &&
        session.questionsInSession >= 10 &&
        session.correctFirstInSession === session.questionsInSession),
  );
  push("combo-5", snapshot.bestCombo >= 5);
  push("combo-12", snapshot.bestCombo >= 12);
  push("speed-150", Math.max(snapshot.speedBest, session?.speedScore ?? 0) >= 150);
  push("speed-300", Math.max(snapshot.speedBest, session?.speedScore ?? 0) >= 300);
  push("streak-3", snapshot.dailyStreak >= 3);
  push("streak-7", snapshot.dailyStreak >= 7);
  push("streak-30", snapshot.dailyStreak >= 30);
  push(
    "polyglot",
    GAME_LANGUAGES.every((lang) => snapshot.languagesPlayed.includes(lang)),
  );
  push("listener", snapshot.listenRoundsCompleted >= 1);
  push("level-10", levelForXp(snapshot.xpTotal).level >= 10);
  push(
    "sharpshooter",
    snapshot.answeredTotal >= 50 && snapshot.firstTryAccuracyPct >= 80,
  );

  return unlocked;
}
