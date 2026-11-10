/**
 * Client-side dictionary pack loading + validation.
 *
 * Packs are static JSON under /public/dictionaries, lazy-loaded per language
 * and cached for the page session. Validation happens at the boundary so a
 * corrupted pack fails loudly instead of poisoning the game.
 */

import {
  DIFFICULTY_TIERS,
  GAME_LANGUAGES,
  type DictionaryPack,
  type DifficultyTier,
  type LanguageCode,
  type PackEntry,
  type PackIndex,
} from "@/types/game";

/** Base path for static assets (GitHub Pages project sites set this at build). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export class PackValidationError extends Error {
  constructor(
    message: string,
    readonly problems: string[],
  ) {
    super(message);
    this.name = "PackValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const TIER_SET: ReadonlySet<string> = new Set<string>(DIFFICULTY_TIERS);

/**
 * Validate and normalize a parsed dictionary pack. Throws
 * {@link PackValidationError} with every problem found (not just the first).
 */
export function validatePack(data: unknown): DictionaryPack {
  const problems: string[] = [];
  if (!isRecord(data)) {
    throw new PackValidationError("Pack root is not an object", ["root must be an object"]);
  }
  const meta = data.meta;
  const entries = data.entries;

  if (!isRecord(meta)) {
    problems.push("meta must be an object");
  }
  if (!Array.isArray(entries)) {
    problems.push("entries must be an array");
  }
  if (problems.length > 0) {
    throw new PackValidationError("Pack structure is invalid", problems);
  }

  const seenWords = new Set<string>();
  const validEntries: PackEntry[] = [];

  (entries as unknown[]).forEach((raw, index) => {
    if (!isRecord(raw)) {
      problems.push(`entries[${index}] is not an object`);
      return;
    }
    const w = raw.w;
    const ipa = raw.ipa;
    const xs = raw.xs;
    const tier = raw.tier;

    if (typeof w !== "string" || w.length === 0) {
      problems.push(`entries[${index}].w must be a non-empty string`);
      return;
    }
    // Register the word before field validation so duplicates are caught even
    // when the earlier entry has other defects.
    const key = w.toLowerCase();
    if (seenWords.has(key)) {
      problems.push(`entries[${index}]: duplicate word "${w}"`);
      return;
    }
    seenWords.add(key);

    if (typeof ipa !== "string" || ipa.length === 0) {
      problems.push(`entries[${index}] (${w}): ipa must be a non-empty string`);
      return;
    }
    if (typeof xs !== "string" || xs.length === 0) {
      problems.push(`entries[${index}] (${w}): xs must be a non-empty string`);
      return;
    }
    if (typeof tier !== "string" || !TIER_SET.has(tier)) {
      problems.push(`entries[${index}] (${w}): tier must be one of ${DIFFICULTY_TIERS.join("|")}`);
      return;
    }
    validEntries.push({ w, ipa, xs, tier: tier as DifficultyTier });
  });

  const metaRecord = meta as Record<string, unknown>;
  const lang = metaRecord.lang;
  if (typeof lang !== "string" || !GAME_LANGUAGES.includes(lang as LanguageCode)) {
    problems.push(`meta.lang must be one of ${GAME_LANGUAGES.join("|")}`);
  }

  if (problems.length > 0) {
    throw new PackValidationError(
      `Pack validation failed with ${problems.length} problem(s)`,
      problems,
    );
  }

  const tierCounts = Object.fromEntries(
    DIFFICULTY_TIERS.map((t) => [t, validEntries.filter((e) => e.tier === t).length]),
  ) as Record<DifficultyTier, number>;

  return {
    meta: {
      lang: lang as LanguageCode,
      version: 2,
      generatedAt: typeof metaRecord.generatedAt === "string" ? metaRecord.generatedAt : "",
      source: typeof metaRecord.source === "string" ? metaRecord.source : "",
      count: validEntries.length,
      tiers: tierCounts,
    },
    entries: validEntries,
  };
}

const packCache = new Map<LanguageCode, Promise<DictionaryPack>>();

/** Fetch (and memoize) the curated pack for a language. */
export function loadPack(language: LanguageCode, fetchImpl: typeof fetch = fetch): Promise<DictionaryPack> {
  const cached = packCache.get(language);
  if (cached) {
    return cached;
  }
  const promise = (async () => {
    const response = await fetchImpl(`${BASE_PATH}/dictionaries/${language}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load dictionary pack "${language}": HTTP ${response.status}`);
    }
    return validatePack(await response.json());
  })();
  packCache.set(language, promise);
  return promise;
}

/** Test helper: clear the memoized pack cache. */
export function clearPackCache(): void {
  packCache.clear();
}

/** Fetch the pack index (language counts/tiers for the home screen). */
export async function loadPackIndex(fetchImpl: typeof fetch = fetch): Promise<PackIndex> {
  const response = await fetchImpl(`${BASE_PATH}/dictionaries/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to load dictionary index: HTTP ${response.status}`);
  }
  return (await response.json()) as PackIndex;
}
