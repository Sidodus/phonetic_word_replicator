/**
 * Question generation: word selection + multiple-choice distractors.
 *
 * Selection is deterministic given a seed (mulberry32 via {@link Rng}) so the
 * daily challenge is identical for every player that day, and tests can pin
 * exact outcomes.
 */

import type {
  DictionaryPack,
  DifficultyTier,
  PackEntry,
  Question,
} from "@/types/game";
import { CHOICE_OPTION_COUNT } from "@/types/game";
import type { Rng } from "./rng";

/** Options for building a question set. */
export interface PickQuestionsOptions {
  count: number;
  rng: Rng;
  /** Restrict to one tier, or "mixed" to draw across all tiers. */
  tier?: DifficultyTier | "mixed";
  /** Words to exclude (e.g. already served this session), case-insensitive. */
  exclude?: ReadonlySet<string>;
}

export class QuestionGenerationError extends Error {}

/** Deterministic per-language seed for the daily challenge. */
export function dailySeedFor(dateKey: string, language: string): string {
  return `pwr-daily-v2::${dateKey}::${language}`;
}

function entriesByTier(pack: DictionaryPack, tier: DifficultyTier): PackEntry[] {
  return pack.entries.filter((entry) => entry.tier === tier);
}

function pickEntries(pack: DictionaryPack, options: PickQuestionsOptions): PackEntry[] {
  const { count, rng, tier = "mixed", exclude } = options;
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`count must be a non-negative integer, received ${count}`);
  }

  const pools =
    tier === "mixed"
      ? [pack.entries]
      : [entriesByTier(pack, tier)];

  // Single-tier pools can be smaller than requested; top up from the pack.
  let available = pools[0].filter((entry) => !exclude?.has(entry.w.toLowerCase()));
  if (available.length < count) {
    available = pack.entries.filter((entry) => !exclude?.has(entry.w.toLowerCase()));
  }

  if (available.length === 0) {
    throw new QuestionGenerationError(
      `No entries available for language "${pack.meta.lang}" (tier: ${tier})`,
    );
  }

  if (available.length < count) {
    throw new QuestionGenerationError(
      `Requested ${count} questions but only ${available.length} entries available for language "${pack.meta.lang}"`,
    );
  }

  return rng.shuffle(available).slice(0, count);
}

/** Build a batch of questions (without choice options) from a pack. */
export function pickQuestions(pack: DictionaryPack, options: PickQuestionsOptions): Question[] {
  return pickEntries(pack, options).map((entry) => ({
    word: entry.w,
    ipa: entry.ipa,
    xsampa: entry.xs,
    tier: entry.tier,
  }));
}

interface DistractorCandidate {
  word: string;
  score: number;
}

/**
 * Score a candidate distractor by similarity to the answer: similar length and
 * shared phonetic characters make plausible, learnable confusions. The RNG
 * jitter breaks ties so seeded runs stay deterministic.
 */
function similarityScore(answer: PackEntry, candidate: PackEntry, rng: Rng): number {
  const lengthDelta = Math.abs(answer.w.length - candidate.w.length);
  let score = lengthDelta <= 2 ? 2 : 0;

  const answerSounds = new Set(Array.from(answer.ipa));
  let shared = 0;
  for (const ch of candidate.ipa) {
    if (answerSounds.has(ch)) {
      shared += 1;
      if (shared >= 5) break;
    }
  }
  score += shared;

  // ±0.5 jitter keeps ordering stable-ish while avoiding identical runs.
  return score + rng.next() * 0.5;
}

/**
 * Build a multiple-choice option list containing the answer.
 * Distractors come from the same tier when possible (falling back to the whole
 * pack for small dictionaries), are unique case-insensitively, and never equal
 * the answer.
 */
export function buildChoiceOptions(
  answer: PackEntry,
  pack: DictionaryPack,
  rng: Rng,
): string[] {
  const answerKey = answer.w.toLowerCase();
  const sameTier = entriesByTier(pack, answer.tier).filter((e) => e.w.toLowerCase() !== answerKey);
  const pool = sameTier.length >= CHOICE_OPTION_COUNT - 1 ? sameTier : pack.entries;

  const candidates: DistractorCandidate[] = [];
  const seen = new Set<string>([answerKey]);
  for (const entry of pool) {
    const key = entry.w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ word: entry.w, score: similarityScore(answer, entry, rng) });
  }

  if (candidates.length < CHOICE_OPTION_COUNT - 1) {
    throw new QuestionGenerationError(
      `Pack for "${pack.meta.lang}" is too small to build ${CHOICE_OPTION_COUNT} options for "${answer.w}"`,
    );
  }

  candidates.sort((a, b) => b.score - a.score);

  // Take a candidate window near the top so "most similar" isn't always the
  // same few words, then shuffle the final option order.
  const windowSize = Math.min(candidates.length, CHOICE_OPTION_COUNT * 4);
  const distractors = rng
    .shuffle(candidates.slice(0, windowSize))
    .slice(0, CHOICE_OPTION_COUNT - 1)
    .map((c) => c.word);

  return rng.shuffle([answer.w, ...distractors]);
}

/** Build question batches with multiple-choice options attached. */
export function pickChoiceQuestions(
  pack: DictionaryPack,
  options: PickQuestionsOptions,
): Question[] {
  const entries = pickEntries(pack, options);
  return entries.map((entry) => ({
    word: entry.w,
    ipa: entry.ipa,
    xsampa: entry.xs,
    tier: entry.tier,
    options: buildChoiceOptions(entry, pack, options.rng),
  }));
}
