/**
 * Daily-challenge streak tracking.
 *
 * All date math uses local-calendar date keys ("YYYY-MM-DD") computed at local
 * noon, so streaks are correct across DST transitions and timezone quirks.
 */

import { parseDateKey, previousDateKey } from "./rng";

export interface StreakUpdate {
  current: number;
  longest: number;
  /** True when this completion is the first for `todayKey`. */
  isNewToday: boolean;
}

/**
 * Fold a completion on `todayKey` into a stored streak.
 *
 * - Completing twice on the same day keeps the streak unchanged.
 * - Completing the day after the last completion extends it.
 * - Skipping one or more days resets it to 1.
 */
export function applyDailyCompletion(
  lastDateKey: string | null,
  currentStreak: number,
  todayKey: string,
): StreakUpdate {
  if (!Number.isInteger(currentStreak) || currentStreak < 0) {
    throw new RangeError(`currentStreak must be a non-negative integer, received ${currentStreak}`);
  }

  if (lastDateKey === todayKey) {
    return { current: currentStreak, longest: currentStreak, isNewToday: false };
  }

  const isNewToday = true;
  const extendsStreak = lastDateKey !== null && previousDateKey(todayKey) === lastDateKey;
  const current = extendsStreak ? currentStreak + 1 : 1;
  return { current, longest: Math.max(currentStreak, current), isNewToday };
}

/** True when the two keys are consecutive calendar days (`b` follows `a`). */
export function isConsecutiveDay(a: string, b: string): boolean {
  return previousDateKey(b) === a && parseDateKey(b) > parseDateKey(a);
}
