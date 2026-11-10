/**
 * Text normalization for answer checking and pronunciation display.
 *
 * Pure functions only — no locale-dependent behavior beyond Unicode, so tests
 * are deterministic everywhere.
 */

/** Strip phonetic wrapper characters: `/…/`, `[…]`, or both around a value. */
export function stripPhoneticWrappers(value: string): string {
  return value
    .trim()
    .replace(/^[/[]+/, "")
    .replace(/[/\]]+$/, "")
    .trim();
}

/** Lowercase in a Unicode-safe way (Turkish dotted-I handled by toLowerCase). */
function foldCase(value: string): string {
  return value.toLowerCase();
}

/**
 * Remove diacritics by decomposing and dropping combining marks.
 * CJK/Devanagari strings are unaffected (no combining marks), so this is safe
 * to apply uniformly.
 */
export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export interface NormalizeOptions {
  /**
   * When true, "café" and "cafe" match. Players keep full marks either way;
   * strict mode rewards careful spellers.
   */
  accentInsensitive: boolean;
}

/**
 * Canonical form used to compare a player's answer with the target word:
 * Unicode NFC, trimmed, inner whitespace collapsed, case-folded, and
 * optionally accent-folded.
 */
export function normalizeAnswer(value: string, options: NormalizeOptions): string {
  const nfc = value.normalize("NFC").trim().replace(/\s+/g, " ");
  const folded = foldCase(nfc);
  return options.accentInsensitive ? stripDiacritics(folded) : folded;
}

/** Convenience wrapper for the strict (accent-sensitive) comparison. */
export function normalizeStrict(value: string): string {
  return normalizeAnswer(value, { accentInsensitive: false });
}

/**
 * True when the answer matches the target under the given strictness.
 * Empty/whitespace-only answers never match.
 */
export function isAnswerCorrect(
  answer: string,
  target: string,
  options: NormalizeOptions,
): boolean {
  const normalizedAnswer = normalizeAnswer(answer, options);
  if (normalizedAnswer.length === 0) {
    return false;
  }
  return normalizedAnswer === normalizeAnswer(target, options);
}
