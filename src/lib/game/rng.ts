/**
 * Deterministic, seedable RNG utilities.
 *
 * Every randomness in the game flows through here so that daily challenges are
 * reproducible from a date key and tests can assert exact sequences.
 */

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Uniform element of a non-empty array. Throws on empty input. */
  pick<T>(items: readonly T[]): T;
  /** Fisher–Yates copy — the input array is not mutated. */
  shuffle<T>(items: readonly T[]): T[];
}

/**
 * FNV-1a 32-bit hash: stable string → seed conversion across platforms.
 * Used to turn date keys ("2026-11-10") into numeric seeds.
 */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV prime multiplication via shifts to stay in int range.
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Mulberry32 — tiny, fast, well-distributed PRNG with a 32-bit seed.
 * Reference implementation (Tommy Ettinger), adapted to TypeScript.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Compose a string seed + optional salt into an {@link Rng}. */
export function createRng(seed: string | number, salt = ""): Rng {
  const numericSeed =
    typeof seed === "number" ? seed >>> 0 : hashSeed(salt ? `${seed}::${salt}` : seed);
  const next = mulberry32(numericSeed);
  return {
    next,
    int(maxExclusive: number): number {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new RangeError(`int() requires a positive integer, received ${maxExclusive}`);
      }
      return Math.floor(next() * maxExclusive);
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new RangeError("pick() requires a non-empty array");
      }
      return items[this.int(items.length)];
    },
    shuffle<T>(items: readonly T[]): T[] {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        const tmp = out[i];
        out[i] = out[j];
        out[j] = tmp;
      }
      return out;
    },
  };
}

/** Format a Date as its local-calendar `YYYY-MM-DD` key (timezone-safe). */
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse a `YYYY-MM-DD` key into a local-noon Date (DST-safe arithmetic). */
export function parseDateKey(key: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) {
    throw new RangeError(`Invalid date key: ${key}`);
  }
  // Noon avoids midnight/DST edge cases when moving between days.
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
}

/** The calendar day immediately before `key`. */
export function previousDateKey(key: string): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}
