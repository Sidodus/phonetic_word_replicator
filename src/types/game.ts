/**
 * Core domain types for Phonetic Word Replicator v2.
 *
 * These types are the contract between the data pipeline (scripts/curate-dictionary.mjs),
 * the pure game engine (src/lib/game) and the UI (src/components, src/app).
 * Keep them free of React and browser APIs.
 */

/** The 8 languages with curated Wiktionary game dictionaries. */
export const GAME_LANGUAGES = ["en", "zh", "nl", "fr", "de", "hi", "it", "es"] as const;
export type LanguageCode = (typeof GAME_LANGUAGES)[number];

/** The two phonetic notations the game quizzes on. */
export const PHONETIC_STANDARDS = ["IPA", "X-SAMPA"] as const;
export type PhoneticStandard = (typeof PHONETIC_STANDARDS)[number];

/** Game modes. `classic` reproduces the v1 loop; the rest are v2 additions. */
export const GAME_MODES = ["classic", "choice", "listen", "speed", "daily"] as const;
export type GameMode = (typeof GAME_MODES)[number];

/** Difficulty tiers assigned by the curation pipeline (see docs/DATA_PIPELINE.md). */
export const DIFFICULTY_TIERS = ["starter", "core", "advanced"] as const;
export type DifficultyTier = (typeof DIFFICULTY_TIERS)[number];

/** How a question ended, aligned with the v1 colour coding. */
export type AttemptOutcome =
  | "correct-first" // blue
  | "correct-second" // yellow
  | "correct-third" // red
  | "failed" // grey — wrong through all 3 attempts
  | "skipped"; // grey — player moved on; treated as failed for stats

/** Attempts per question, mirroring v1's 3-strike rule. */
export const MAX_ATTEMPTS = 3;

/**
 * A single curated dictionary entry. Keys are compact to keep the shipped
 * packs small; see `DictionaryEntry` docs in DATA_PIPELINE.md.
 */
export interface PackEntry {
  /** The word the player must spell. */
  w: string;
  /** IPA pronunciation without wrapper slashes/brackets. */
  ipa: string;
  /** X-SAMPA pronunciation without wrapper slashes/brackets. */
  xs: string;
  /** Difficulty tier derived from word length by the pipeline. */
  tier: DifficultyTier;
}

export interface PackMeta {
  lang: LanguageCode;
  /** Pack format version — bump on breaking schema changes. */
  version: 2;
  generatedAt: string;
  source: string;
  count: number;
  tiers: Record<DifficultyTier, number>;
}

export interface DictionaryPack {
  meta: PackMeta;
  entries: PackEntry[];
}

export interface PackIndexEntry {
  file: string;
  count: number;
  bytes: number;
  tiers: Record<DifficultyTier, number>;
}

export interface PackIndex {
  version: 2;
  generatedAt: string;
  languages: Record<LanguageCode, PackIndexEntry>;
}

/** A question presented to the player. */
export interface Question {
  word: string;
  ipa: string;
  xsampa: string;
  tier: DifficultyTier;
  /** Populated only for the multiple-choice mode; includes the answer. */
  options?: string[];
}

/** Number of options in a multiple-choice question. */
export const CHOICE_OPTION_COUNT = 4;

/** The current question while a player is working on it. */
export interface ActiveQuestion {
  question: Question;
  /** 1-based attempt counter. */
  attemptNumber: number;
  /** Hints consumed on this question so far. */
  hintsUsed: number;
  status: "active" | "revealed";
}

export interface AttemptRecord {
  word: string;
  ipa: string;
  xsampa: string;
  tier: DifficultyTier;
  mode: GameMode;
  outcome: AttemptOutcome;
  /** 0 for skipped/failed records: no attempt produced a correct answer. */
  attemptsUsed: number;
  hintsUsed: number;
  xpEarned: number;
  answeredAt: number;
}

export interface SessionSummary {
  mode: GameMode;
  language: LanguageCode;
  records: AttemptRecord[];
  xpEarned: number;
  hintsUsed: number;
  bestCombo: number;
  /** Speed mode only: final score, 0 otherwise. */
  speedScore: number;
  startedAt: number;
  endedAt: number;
  /** Convenience counts for achievement evaluation. */
  questionsInSession: number;
  correctFirstInSession: number;
}

/** Aggregated, per-outcome counters — the v2 replacement for v1's loose keys. */
export interface OutcomeCounts {
  correctFirst: number;
  correctSecond: number;
  correctThird: number;
  wrong: number;
  skipped: number;
}
