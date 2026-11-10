/**
 * Hint system — the v2 replacement for v1's "Show Hints" flow.
 *
 * v1 bug this module regression-tests against: the mask loop used
 * `([i] % 2) !== 1`, where `[i]` is an array literal (always truthy, never 1),
 * so both hint patterns revealed the same characters. Here patterns are
 * explicit and unit-tested to reveal alternating positions.
 */

import type { Rng } from "./rng";

export type HintPattern = "odd-positions" | "even-positions";

/** Mask shown for a hidden character. */
export const HINT_MASK_CHAR = "_";

/** Words at or below this length only reveal their first letter. */
export const SHORT_WORD_MAX = 4;

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : undefined;

/**
 * Split a word into user-perceived characters (graphemes) so scripts like
 * Devanagari are never broken mid-akshara. Falls back to code points.
 */
export function toGraphemes(word: string): string[] {
  if (segmenter) {
    return Array.from(segmenter.segment(word), (s) => s.segment);
  }
  return Array.from(word);
}

/** Randomly select one of the two mask patterns. */
export function pickHintPattern(rng: Rng): HintPattern {
  return rng.next() < 0.5 ? "odd-positions" : "even-positions";
}

/**
 * Build the masked hint display for a word.
 *
 * - Words with ≤ SHORT_WORD_MAX graphemes reveal only the first character
 *   (alternating masks would give away too much of a short word).
 * - Longer words reveal every other character; `pattern` selects which parity.
 *
 * The target word is never returned by this function.
 */
export function buildHintMask(word: string, pattern: HintPattern): string {
  const graphemes = toGraphemes(word);
  if (graphemes.length === 0) {
    return "";
  }

  if (graphemes.length <= SHORT_WORD_MAX) {
    return graphemes[0] + HINT_MASK_CHAR.repeat(graphemes.length - 1);
  }

  return graphemes
    .map((grapheme, index) => {
      const reveal = pattern === "odd-positions" ? index % 2 === 1 : index % 2 === 0;
      return reveal ? grapheme : HINT_MASK_CHAR;
    })
    .join("");
}

/**
 * XP penalty owed for a number of hint uses: every 3 hints cost the
 * equivalent of one failed answer (see GAME_DESIGN.md → "Hints").
 */
export const HINT_PENALTY_STEP = 3;
export const HINT_PENALTY_XP = 15;

export function hintPenaltyXp(hintsUsed: number): number {
  if (!Number.isInteger(hintsUsed) || hintsUsed < 0) {
    throw new RangeError(`hintsUsed must be a non-negative integer, received ${hintsUsed}`);
  }
  return Math.floor(hintsUsed / HINT_PENALTY_STEP) * HINT_PENALTY_XP;
}
