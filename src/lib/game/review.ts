/**
 * "Wobbly words" — a Leitner-boxed mistake bank.
 *
 * Words answered without a first-try correct come back for review on a
 * spacing schedule; first-try corrects promote them until they graduate.
 * All functions are pure: they take a bank and return a new bank.
 *
 * Key format: `${lang}:${word.toLowerCase()}` — the display word (original
 * casing, needed for German/Dutch nouns) is stored inside the entry.
 */

import type { AttemptOutcome, LanguageCode } from "@/types/game";

/** Boxes 0..4. Box 0 = struggling/failed; box 4 = about to graduate. */
export const REVIEW_BOXES = 5;

/** Hours until a word in each box becomes due again. Box 0 due after 1 hour. */
export const REVIEW_INTERVALS_HOURS: readonly number[] = [1, 24, 72, 168, 336];

/** Hard cap on tracked words (global) — keeps localStorage bounded. */
export const MAX_REVIEW_ENTRIES = 600;

export interface ReviewEntry {
  /** Display word with original casing. */
  word: string;
  box: number;
  lastSeen: number;
  lastOutcome: AttemptOutcome;
}

export type ReviewBank = Record<string, ReviewEntry>;

export class ReviewWordError extends Error {}

export function reviewKey(language: LanguageCode, word: string): string {
  return `${language}:${word.toLowerCase()}`;
}

/** Hours until a word in `box` is due again. */
export function intervalHoursForBox(box: number): number {
  if (!Number.isInteger(box) || box < 0 || box >= REVIEW_BOXES) {
    throw new RangeError(`box must be 0-${REVIEW_BOXES - 1}, received ${box}`);
  }
  return REVIEW_INTERVALS_HOURS[box];
}

const HOUR_MS = 3_600_000;

/** True when the entry's next review time has passed. */
export function isReviewDue(entry: ReviewEntry, now: number): boolean {
  return now - entry.lastSeen >= intervalHoursForBox(entry.box) * HOUR_MS;
}

/**
 * All due entries for a language, most-needy first: lowest box, then longest
 * unseen. Returns the entry objects (they carry the display word).
 */
export function dueReviewEntries(
  bank: ReviewBank,
  language: LanguageCode,
  now: number,
): ReviewEntry[] {
  const prefix = `${language}:`;
  return Object.entries(bank)
    .filter(([key, entry]) => key.startsWith(prefix) && isReviewDue(entry, now))
    .map(([, entry]) => entry)
    .sort((a, b) => a.box - b.box || a.lastSeen - b.lastSeen);
}

export function countDueReview(
  bank: ReviewBank,
  language: LanguageCode,
  now: number,
): number {
  return dueReviewEntries(bank, language, now).length;
}

/** Number of tracked words for a language. */
export function countTrackedReview(bank: ReviewBank, language: LanguageCode): number {
  const prefix = `${language}:`;
  return Object.keys(bank).filter((key) => key.startsWith(prefix)).length;
}

/**
 * Fold one answered question into the bank.
 *
 * - correct-first  → promote one box (cap at the top box)
 * - correct-second / correct-third → hold the box (it still needs practice)
 * - failed / skipped → back to box 0
 */
export function applyReviewResult(
  bank: ReviewBank,
  language: LanguageCode,
  word: string,
  outcome: AttemptOutcome,
  now: number,
): ReviewBank {
  if (word.trim().length === 0) {
    throw new ReviewWordError("word must be non-empty");
  }
  const key = reviewKey(language, word);
  const existing = bank[key];
  const currentBox = existing?.box ?? 0;

  let box: number;
  switch (outcome) {
    case "correct-first":
      box = Math.min(currentBox + 1, REVIEW_BOXES - 1);
      break;
    case "correct-second":
    case "correct-third":
      box = currentBox;
      break;
    case "failed":
    case "skipped":
      box = 0;
      break;
  }

  const next: ReviewBank = {
    ...bank,
    [key]: { word, box, lastSeen: now, lastOutcome: outcome },
  };
  return evictToCap(next);
}

/**
 * Enforce the global cap: keep the neediest words (lowest box, most recent
 * practice) and evict the healthiest/stalest first.
 */
export function evictToCap(bank: ReviewBank): ReviewBank {
  const keys = Object.keys(bank);
  if (keys.length <= MAX_REVIEW_ENTRIES) {
    return bank;
  }
  // Keep order: lowest box first, then newest lastSeen first.
  const sorted = keys.sort((a, b) => {
    const ea = bank[a];
    const eb = bank[b];
    return ea.box - eb.box || eb.lastSeen - ea.lastSeen;
  });
  const next: ReviewBank = {};
  for (const key of sorted.slice(0, MAX_REVIEW_ENTRIES)) {
    next[key] = bank[key];
  }
  return next;
}
