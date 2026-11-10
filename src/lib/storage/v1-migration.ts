/**
 * Best-effort migration from v1's loose localStorage keys.
 *
 * v1 stored per-language stats under ad-hoc keys, suffixed for every language
 * except English (e.g. "Correct Word On 1st Attempt(hi)" but
 * "Correct Word On 1st Attempt" for English). History entries carry a
 * Bootstrap background class that maps 1:1 to the v2 outcome colour coding.
 *
 * Migration is additive: v2 counters gain the v1 numbers, existing v2 history
 * is never overwritten. Errors in individual keys are skipped (logged) — a
 * partially-readable legacy store must not block the game.
 */

import type { AttemptOutcome, AttemptRecord, LanguageCode } from "@/types/game";
import { stripPhoneticWrappers } from "@/lib/game/normalize";

/** v1 language names → v2 codes ("Italia" was v1's spelling of Italian). */
const V1_LANGUAGE_NAMES: Readonly<Record<string, LanguageCode>> = {
  English: "en",
  Chinese: "zh",
  Dutch: "nl",
  French: "fr",
  German: "de",
  Hindi: "hi",
  Italia: "it",
  Spanish: "es",
};

const OUTCOME_BY_V1_CLASS: Readonly<Record<string, AttemptOutcome>> = {
  "bg-primary": "correct-first",
  "bg-warning": "correct-second",
  "bg-danger": "correct-third",
  "bg-secondary": "failed",
};

export interface V1LanguageCounts {
  correctFirst: number;
  correctSecond: number;
  correctThird: number;
  wrong: number;
  hintsUsed: number;
}

export interface V1ImportResult {
  hasAnyData: boolean;
  languages: Partial<Record<LanguageCode, V1LanguageCounts>>;
  /** Oldest-last order, capped by the caller. */
  history: AttemptRecord[];
  /** v1's stored phonetic standard, if any. */
  standard: PhoneticStandard | null;
  /** v1's last selected game language, if any. */
  lastLanguage: LanguageCode | null;
}

type PhoneticStandard = "IPA" | "X-SAMPA";

function toInt(value: string | null): number {
  if (value === null) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Extract everything importable from a Storage instance shaped like v1's
 * localStorage. Pure with respect to the storage argument (read-only).
 */
export function importV1Storage(storage: {
  getItem(key: string): string | null;
}): V1ImportResult {
  const languages: Partial<Record<LanguageCode, V1LanguageCounts>> = {};
  const history: AttemptRecord[] = [];
  let standard: PhoneticStandard | null = null;
  let lastLanguage: LanguageCode | null = null;
  let hasAnyData = false;

  for (const code of Object.values(V1_LANGUAGE_NAMES)) {
    // v1 suffixed keys with the lowercase language CODE for every language
    // except English, which used unsuffixed keys ("...Attempt(hi)", "...(fr)").
    const suffix = code === "en" ? "" : `(${code})`;

    const correctFirst = toInt(storage.getItem(`Correct Word On 1st Attempt${suffix}`));
    const correctSecond = toInt(storage.getItem(`Correct Word On 2nd Attempt${suffix}`));
    const correctThird = toInt(storage.getItem(`Correct Word On 3rd Attempt${suffix}`));
    const wrong = toInt(storage.getItem(`Wrong Word${suffix}`));
    const hintTriples = toInt(storage.getItem(`Deducted Hint Point${suffix}`));
    const runningHints = toInt(storage.getItem(`Hints Count${suffix}`));
    const hintsUsed = hintTriples * 3 + runningHints;

    const counts: V1LanguageCounts = { correctFirst, correctSecond, correctThird, wrong, hintsUsed };
    const hasCounts =
      correctFirst + correctSecond + correctThird + wrong + hintsUsed > 0;
    if (hasCounts) {
      languages[code] = counts;
      hasAnyData = true;
    }

    if (!standard) {
      const raw = storage.getItem(`Phonetics Sound${suffix}`);
      if (raw === "IPA" || raw === "X-SAMPA") {
        standard = raw;
      }
    }

    // History: v1 kept an array of { previousWord, previousIpa,
    // previousXSampa, className }.
    const rawHistory = storage.getItem(`All Attempted Questions${suffix}`);
    if (rawHistory) {
      try {
        const parsed: unknown = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const record = item as {
              previousWord?: unknown;
              previousIpa?: unknown;
              previousXSampa?: unknown;
              className?: unknown;
            };
            const outcome =
              typeof record.className === "string"
                ? OUTCOME_BY_V1_CLASS[record.className]
                : undefined;
            if (
              typeof record.previousWord !== "string" ||
              record.previousWord.length === 0 ||
              typeof record.previousIpa !== "string" ||
              typeof record.previousXSampa !== "string" ||
              !outcome
            ) {
              continue;
            }
            history.push({
              word: record.previousWord,
              ipa: stripPhoneticWrappers(record.previousIpa),
              xsampa: stripPhoneticWrappers(record.previousXSampa),
              tier: "core",
              mode: "classic",
              outcome,
              attemptsUsed:
                outcome === "correct-first"
                  ? 1
                  : outcome === "correct-second"
                    ? 2
                    : outcome === "correct-third"
                      ? 3
                      : 0,
              hintsUsed: 0,
              xpEarned: 0,
              answeredAt: 0,
            });
          }
          if (history.length > 0) {
            hasAnyData = true;
          }
        }
      } catch {
        // Corrupt legacy history: skip it, keep the numeric import.
      }
    }
  }

  const rawLanguage = storage.getItem("PWR Language");
  if (rawLanguage && V1_LANGUAGE_NAMES[rawLanguage]) {
    lastLanguage = V1_LANGUAGE_NAMES[rawLanguage];
  }

  return { hasAnyData, languages, history, standard, lastLanguage };
}
