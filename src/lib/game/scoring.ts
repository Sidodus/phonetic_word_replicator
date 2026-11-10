/**
 * Scoring & progression math.
 *
 * All functions are pure and total: they never return NaN. (v1 produced NaN
 * win rates whenever a stats table was opened before the first attempt —
 * guards here are regression-tested.)
 */

import type { AttemptOutcome } from "@/types/game";

/** XP granted for a correct answer, by attempt number. */
export const XP_BASE = 10;
export const XP_ATTEMPT_BONUS: Readonly<Record<1 | 2 | 3, number>> = { 1: 10, 2: 5, 3: 2 };
/** Extra XP per consecutive first-try correct answer (capped). */
export const XP_COMBO_STEP = 2;
export const XP_COMBO_CAP = 5; // combo 5+ → +10 XP

/**
 * XP for one correctly answered question.
 * @param attemptNumber 1-based attempt on which the answer landed.
 * @param comboStreak consecutive first-try correct answers *including* this one.
 */
export function xpForCorrect(attemptNumber: 1 | 2 | 3, comboStreak: number): number {
  if (attemptNumber !== 1 && attemptNumber !== 2 && attemptNumber !== 3) {
    throw new RangeError(`attemptNumber must be 1-3, received ${attemptNumber}`);
  }
  if (!Number.isInteger(comboStreak) || comboStreak < 1) {
    throw new RangeError(`comboStreak must be a positive integer, received ${comboStreak}`);
  }
  const comboBonus = Math.min(comboStreak, XP_COMBO_CAP) * XP_COMBO_STEP;
  return XP_BASE + XP_ATTEMPT_BONUS[attemptNumber] + comboBonus;
}

/** XP for a question that ended without a correct answer. */
export const XP_FOR_MISS = 0;

/** Speed-mode multiplier: x1 → x2 at a 3-streak → x3 at a 6-streak (capped). */
export const SPEED_MULTIPLIER_CAP = 3;

export function speedMultiplier(correctStreak: number): number {
  if (!Number.isInteger(correctStreak) || correctStreak < 0) {
    throw new RangeError(`correctStreak must be a non-negative integer, received ${correctStreak}`);
  }
  return Math.min(1 + Math.floor(correctStreak / 3), SPEED_MULTIPLIER_CAP);
}

/** Points per correct answer in speed mode (multiplier applied by caller). */
export const SPEED_POINTS_PER_CORRECT = 10;

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

/** XP required to advance *from* level `level` (level 1 → 2 costs 50). */
export function xpToAdvanceFromLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError(`level must be a positive integer, received ${level}`);
  }
  return 50 * level;
}

/** Total XP required to *reach* a level (level 1 = 0 XP). */
export function totalXpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError(`level must be a positive integer, received ${level}`);
  }
  // Sum of 50 * i for i in 1..level-1  →  50 * level * (level - 1) / 2
  return 25 * level * (level - 1);
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  /** 0..1 progress through the current level; 1 only at the cap sentinel. */
  progress: number;
}

/** Derive level progression from a lifetime XP total (clamped at level 100). */
export const MAX_LEVEL = 100;

export function levelForXp(totalXp: number): LevelProgress {
  if (!Number.isFinite(totalXp) || totalXp < 0) {
    throw new RangeError(`totalXp must be a finite non-negative number, received ${totalXp}`);
  }
  let level = 1;
  let remaining = totalXp;
  while (level < MAX_LEVEL) {
    const cost = xpToAdvanceFromLevel(level);
    if (remaining < cost) {
      break;
    }
    remaining -= cost;
    level += 1;
  }
  const xpForNext = level === MAX_LEVEL ? 0 : xpToAdvanceFromLevel(level);
  return {
    level,
    xpIntoLevel: remaining,
    xpForNext,
    progress: level === MAX_LEVEL ? 1 : remaining / xpToAdvanceFromLevel(level),
  };
}

// ---------------------------------------------------------------------------
// Outcome helpers (v1 colour coding preserved)
// ---------------------------------------------------------------------------

/** Map an attempt result to its outcome label. */
export function outcomeForAttempt(
  attemptNumber: number,
  correct: boolean,
): Extract<AttemptOutcome, "correct-first" | "correct-second" | "correct-third"> {
  if (correct) {
    if (attemptNumber <= 1) return "correct-first";
    if (attemptNumber === 2) return "correct-second";
    return "correct-third";
  }
  // Wrong answers don't produce an outcome record until the question ends.
  throw new RangeError("Wrong answers must be recorded via endQuestion, not outcomeForAttempt");
}

/** Bootstrap badge variant matching v1's colour semantics. */
export function badgeVariantFor(
  outcome: AttemptOutcome,
): "primary" | "warning" | "danger" | "secondary" {
  switch (outcome) {
    case "correct-first":
      return "primary";
    case "correct-second":
      return "warning";
    case "correct-third":
      return "danger";
    case "failed":
    case "skipped":
      return "secondary";
  }
}

// ---------------------------------------------------------------------------
// Win-rate statistics (NaN-safe — the v1 regression)
// ---------------------------------------------------------------------------

export interface OutcomeStats {
  correctFirst: number;
  correctSecond: number;
  correctThird: number;
  wrong: number;
  skipped: number;
  total: number;
  /** Percentages rounded to 2 decimals; 0 when total is 0 (never NaN). */
  correctFirstPct: number;
  correctSecondPct: number;
  correctThirdPct: number;
  wrongPct: number;
  skippedPct: number;
  /** Any correct answer (1st/2nd/3rd attempt) as a percentage. */
  accuracyPct: number;
  /** First-try accuracy — the "win rate" headline metric. */
  firstTryAccuracyPct: number;
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 10000) / 100;
}

export function computeOutcomeStats(counts: {
  correctFirst: number;
  correctSecond: number;
  correctThird: number;
  wrong: number;
  skipped: number;
}): OutcomeStats {
  const total =
    counts.correctFirst + counts.correctSecond + counts.correctThird + counts.wrong + counts.skipped;
  const correct = counts.correctFirst + counts.correctSecond + counts.correctThird;
  return {
    ...counts,
    total,
    correctFirstPct: pct(counts.correctFirst, total),
    correctSecondPct: pct(counts.correctSecond, total),
    correctThirdPct: pct(counts.correctThird, total),
    wrongPct: pct(counts.wrong, total),
    skippedPct: pct(counts.skipped, total),
    accuracyPct: pct(correct, total),
    firstTryAccuracyPct: pct(counts.correctFirst, total),
  };
}
