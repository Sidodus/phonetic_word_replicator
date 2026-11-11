#!/usr/bin/env node
/**
 * Dictionary curation pipeline — raw Wiktionary data → game-ready packs.
 *
 * Usage:
 *   node scripts/curate-dictionary.mjs             # generate packs + index
 *   node scripts/curate-dictionary.mjs --validate  # re-validate shipped packs
 *
 * Contract (docs/DATA_PIPELINE.md):
 *   - Deterministic: identical inputs produce byte-identical packs.
 *   - Filters: valid IPA + X-SAMPA, no digits/spaces, sensible word length,
 *     per-language character sets, case-insensitive dedupe, proper-noun
 *     exclusion for en/fr/es/it.
 *   - Tiers: latin ≤4 starter / 5-8 core / 9-12 advanced; zh 1 / 2 / 3-4 chars.
 *   - Caps: starter 700, core 800, advanced 500 per language (small languages
 *     ship their full pool).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "data", "raw", "wiktionary-json");
const FREQ_DIR = path.join(ROOT, "data", "frequency");
const OUT_DIR = path.join(ROOT, "public", "dictionaries");

const LANGUAGES = ["en", "zh", "nl", "fr", "de", "hi", "it", "es"];
const TIER_CAPS = { starter: 700, core: 800, advanced: 500 };

/**
 * Load the vendored frequency list for a language (word → rank, 1 = most
 * common). Sources: hermitdave/FrequencyWords (OpenSubtitles-derived), see
 * docs/DATA_PIPELINE.md. Missing file → empty map (hash-order fallback).
 */
function loadFrequency(language) {
  const file = path.join(FREQ_DIR, `${language}.txt`);
  if (!fs.existsSync(file)) return new Map();
  const map = new Map();
  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const spaceAt = trimmed.indexOf(" ");
    const word = trimmed.slice(0, spaceAt === -1 ? undefined : spaceAt);
    // Single tokens only — multi-token subtitle phrases never match single words.
    if (!word || /\s/.test(word)) continue;
    if (!map.has(word)) map.set(word, map.size + 1);
  }
  return map;
}

// Language-specific word shape rules. Latin/Devanagari words must start and
// end with a letter so punctuation-edged junk ("a-", "o'", bare matras) is
// rejected; Devanagari matras (Mn) are allowed inside aksharas.
const CHAR_FILTERS = {
  latin: /^[\p{L}][\p{L}''-]*[\p{L}]$/u,
  hi: /^[\p{L}](?:[\p{L}\p{M}]*[\p{L}])?$/u,
  zh: /^[\u4E00-\u9FFF]+$/u,
};
const LANG_SCRIPT = { en: "latin", fr: "latin", de: "latin", es: "latin", it: "latin", nl: "latin", hi: "hi", zh: "zh" };
// Nouns are legitimately capitalized in German and Dutch.
const LOWERCASE_ONLY_LANGS = new Set(["en", "fr", "es", "it"]);

const LATIN_MIN = 2;
const LATIN_MAX = 12;
const ZH_MAX_CHARS = 4;

function stripWrappers(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^[/[]+/, "").replace(/[/\]]+$/, "").trim();
}

function tierFor(word, script) {
  const len = Array.from(word).length;
  if (script === "zh") {
    // Single CJK characters are excluded upstream: the pool is dominated by
    // radicals and rare characters with no frequency signal. Multi-character
    // words are the learnable, well-formed pool.
    if (len === 2) return "starter";
    if (len === 3) return "core";
    return "advanced";
  }
  if (len <= 4) return "starter";
  if (len <= 8) return "core";
  return "advanced";
}

/** Deterministic pseudo-random ordering key: length first, then hashed order. */
function hashKey(word) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < word.length; i++) {
    hash ^= word.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash;
}

function curateLanguage(language, frequency) {
  const rawPath = path.join(RAW_DIR, `${language}.dict.v0.json`);
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
  const script = LANG_SCRIPT[language];

  const seen = new Set();
  const kept = [];
  const stats = { total: raw.length, noPron: 0, badShape: 0, properNoun: 0, duplicate: 0, emptyAfterStrip: 0 };

  for (const entry of raw) {
    const pron = Array.isArray(entry.pronunciation) ? entry.pronunciation[0] : undefined;
    if (!pron || pron.lang === "audio") {
      stats.noPron += 1;
      continue;
    }
    const title = typeof entry.title === "string" ? entry.title.trim() : "";
    if (!title) {
      stats.noPron += 1;
      continue;
    }
    if (LOWERCASE_ONLY_LANGS.has(language) && /^\p{Lu}/u.test(title)) {
      stats.properNoun += 1;
      continue;
    }
    const graphemes = Array.from(title);
    const shapeOk =
      !/\s|\d/.test(title) &&
      graphemes.length >= (script === "latin" ? LATIN_MIN : 1) &&
      graphemes.length <= (script === "zh" ? ZH_MAX_CHARS : LATIN_MAX) &&
      // zh: single characters are dropped — see tierFor().
      !(script === "zh" && graphemes.length === 1) &&
      CHAR_FILTERS[script].test(title);
    if (!shapeOk) {
      stats.badShape += 1;
      continue;
    }
    const key = title.toLowerCase();
    if (seen.has(key)) {
      stats.duplicate += 1;
      continue;
    }

    const ipa = stripWrappers(pron.IPA);
    const xs = stripWrappers(pron["X-SAMPA"]);
    if (!ipa || !xs) {
      stats.emptyAfterStrip += 1;
      continue;
    }

    seen.add(key);
    kept.push({ w: title, ipa, xs, tier: tierFor(title, script) });
  }

  // Deterministic cap: within a tier, rank by corpus frequency (most common
  // first) with a word-hash tiebreak for words missing from the list. This
  // keeps builds reproducible while shipping learnable, commonly-met words.
  const byTier = { starter: [], core: [], advanced: [] };
  for (const entry of kept) byTier[entry.tier].push(entry);
  const NO_RANK = Number.MAX_SAFE_INTEGER;
  const rankOf = (word) => frequency.get(word.toLowerCase()) ?? NO_RANK;
  let ranked = 0;
  for (const tier of Object.keys(byTier)) {
    byTier[tier].sort(
      (a, b) => rankOf(a.w) - rankOf(b.w) || hashKey(a.w) - hashKey(b.w),
    );
    byTier[tier] = byTier[tier].slice(0, TIER_CAPS[tier]);
    ranked += byTier[tier].filter((e) => rankOf(e.w) !== NO_RANK).length;
  }

  const entries = [...byTier.starter, ...byTier.core, ...byTier.advanced];
  const tiers = {
    starter: byTier.starter.length,
    core: byTier.core.length,
    advanced: byTier.advanced.length,
  };

  return {
    language,
    entries,
    tiers,
    stats: { ...stats, frequencyRanked: entries.length ? Math.round((ranked / entries.length) * 100) : 0 },
  };
}

function writePacks() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString().slice(0, 10);
  const index = { version: 2, generatedAt, languages: {} };

  for (const language of LANGUAGES) {
    const frequency = loadFrequency(language);
    const { entries, tiers, stats } = curateLanguage(language, frequency);
    const pack = {
      meta: {
        lang: language,
        version: 2,
        generatedAt,
        source: "wiktionary v0 via wikt2pron (abuccts), curated; frequency-ranked (FrequencyWords/OpenSubtitles)",
        count: entries.length,
        tiers,
      },
      entries,
    };
    const json = JSON.stringify(pack);
    const outFile = path.join(OUT_DIR, `${language}.json`);
    fs.writeFileSync(outFile, json);
    index.languages[language] = {
      file: `${language}.json`,
      count: entries.length,
      bytes: Buffer.byteLength(json),
      tiers,
    };
    console.log(
      `${language}: kept ${entries.length} / ${stats.total} raw ` +
        `(tiers ${tiers.starter}/${tiers.core}/${tiers.advanced}, freq-ranked ${stats.frequencyRanked}%) ` +
        `[dropped: shape=${stats.badShape} properNoun=${stats.properNoun} dup=${stats.duplicate} audio/none=${stats.noPron} empty=${stats.emptyAfterStrip}]`,
    );
  }

  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index));
  console.log(`index.json written to ${OUT_DIR}`);
}

function validatePacks() {
  let failures = 0;
  for (const language of LANGUAGES) {
    const outFile = path.join(OUT_DIR, `${language}.json`);
    if (!fs.existsSync(outFile)) {
      console.error(`${language}: MISSING pack (${outFile})`);
      failures += 1;
      continue;
    }
    const pack = JSON.parse(fs.readFileSync(outFile, "utf8"));
    const problems = [];
    if (pack.meta?.lang !== language) problems.push("meta.lang mismatch");
    if (pack.meta?.version !== 2) problems.push("meta.version must be 2");
    if (pack.meta?.count !== pack.entries?.length) problems.push("meta.count mismatch");
    const seen = new Set();
    const tierRe = /^(starter|core|advanced)$/;
    for (const [i, e] of (pack.entries ?? []).entries()) {
      if (typeof e.w !== "string" || !e.w) problems.push(`entries[${i}].w invalid`);
      else if (seen.has(e.w.toLowerCase())) problems.push(`entries[${i}] duplicate "${e.w}"`);
      else seen.add(e.w.toLowerCase());
      if (typeof e.ipa !== "string" || !e.ipa) problems.push(`entries[${i}] (${e.w}) ipa missing`);
      if (typeof e.xs !== "string" || !e.xs) problems.push(`entries[${i}] (${e.w}) xs missing`);
      if (!tierRe.test(String(e.tier))) problems.push(`entries[${i}] (${e.w}) tier invalid`);
    }
    if (problems.length > 0) {
      console.error(`${language}: ${problems.length} problem(s)`);
      for (const p of problems.slice(0, 10)) console.error(`  - ${p}`);
      failures += 1;
    } else {
      console.log(`${language}: OK (${pack.entries.length} entries)`);
    }
  }
  if (failures > 0) {
    process.exitCode = 1;
  } else {
    console.log("All packs valid.");
  }
}

if (process.argv.includes("--validate")) {
  validatePacks();
} else {
  writePacks();
}
