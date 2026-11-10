# Data Pipeline

> Status: current for v2.0.0. The pipeline is deterministic — identical raw input produces
> byte-identical packs. Generated files in `public/dictionaries/` must never be hand-edited.

## Flow

```
data/raw/wiktionary-json/{lang}.dict.v0.json   (Wiktionary v0 via wikt2pron/abuccts)
        │  node scripts/curate-dictionary.mjs
        ▼
public/dictionaries/{lang}.json   pack: { meta, entries: [{ w, ipa, xs, tier }] }
public/dictionaries/index.json    { version, generatedAt, languages: { lang: { file, count, bytes, tiers } } }
```

Run with `npm run data:curate`; validate shipped packs with `npm run data:validate`
(the pack contract also runs inside the Vitest suite as `tests/unit/packs.test.ts`).

## Curation rules (per language)

1. **Normalization** — strip `/…/` and `[…]` wrapper characters from IPA and X-SAMPA;
   skip `lang: "audio"` pronunciation objects; skip empty results after stripping.
2. **Shape filters** — no whitespace, no digits. Character sets:
   - latin (en/fr/de/es/it/nl): `[\p{L}'-]`, must start & end with a letter (rejects
     punctuation-edged junk like `a-` or `o'`), length 2–12.
   - hi: Devanagari letters with matras allowed inside, must start & end with a letter
     (rejects bare combining marks like `ँ`), length 1–12.
   - zh: CJK Unified Ideographs, length 2–4. **Single characters are excluded** — the pool
     is dominated by radicals (犭) and rare characters with no frequency signal to filter by.
3. **Proper-noun exclusion** — titles starting uppercase are dropped for en/fr/es/it
   (mostly place names). German and Dutch nouns are legitimately capitalized and kept.
4. **Deduplication** — case-insensitive on the title, first occurrence wins.
5. **Tiering** by grapheme count:
   | Tier | latin / hi | zh |
   |---|---|---|
   | starter | ≤ 4 | 2 chars |
   | core | 5–8 | 3 chars |
   | advanced | 9–12 | 4 chars |
6. **Caps** — starter 700, core 800, advanced 500. Within a tier: shorter words first,
   ties broken by a word-derived FNV hash (never alphabetically — that would bias toward
   a-words). Languages with fewer entries than the cap (hi, it) ship their full pool.
7. **Determinism** — no time-based seeds anywhere in selection; `generatedAt` is the only
   timestamp and only changes when curation re-runs.

## Shipped pack statistics (v2.0.0 build)

| Language | Raw | Kept | starter/core/advanced | Pack size |
|---|---|---|---|---|
| en | 45,675 | 2,000 | 700/800/500 | 127 KB |
| zh | 68,261 | 2,000 | 700/800/500 | 203 KB |
| nl | 8,646 | 2,000 | 700/800/500 | 129 KB |
| fr | 41,819 | 2,000 | 700/800/500 | 119 KB |
| de | 21,418 | 2,000 | 700/800/500 | 130 KB |
| hi | 1,702 | 874 | 373/439/62 | ~110 KB |
| it | 4,718 | 1,657 | 357/800/500 | ~113 KB |
| es | 6,851 | 1,985 | 685/800/500 | 127 KB |

Drops per language (shape / proper-noun / duplicates / audio-or-missing) are printed by the
script on every run — see the console output for the current numbers.

## Known trade-offs

- **No frequency data.** Selection is length-hash-ordered, so some rare-but-short words
  (e.g. `ed`, `ef` in English) ship. A future improvement could import a per-language
  frequency list to prioritize common words — that would change every pack (major version).
- **zh radicals.** Multi-character words excluded the worst noise; the 2-char pool may still
  contain literary compounds. Acceptable for a native-Chinese audience using IME input.
- **First pronunciation only.** Regional variants (US/UK) beyond the first are not shipped.
- **Proper-noun heuristic** drops some legitimate uppercase words in en/fr/es/it
  (e.g. month names are lowercase in those languages, so the loss is small).

## Changing the pipeline

1. Edit `scripts/curate-dictionary.mjs`.
2. `npm run data:curate` — inspect the console stats.
3. `npm run data:validate` + `npm test` (pack contract tests enforce schema, size budget
   ≤ 400 KB/language, min 300 entries, meta consistency).
4. If pack **content** changes materially (words added/removed/retiered), note it in the
   release notes; if the **daily seed inputs** change (tier composition feeds seeded
   selection), bump the major version per AGENTS.md §10.
