# ADR-0002: Curated per-language dictionary packs

- Status: Accepted (2026-11-10)

## Context

The raw Wiktionary dataset (31 MB) contains ~199k entries including multi-word phrases,
place names ("Buenos Aires"), heraldic compounds ("Croatian chequy"), radicals-as-characters
(犭), and punctuation-edged fragments. Shipping it raw means slow first paints and
demotivating questions. v1 shipped the raw files as-is.

## Decision

A deterministic build-time pipeline (`scripts/curate-dictionary.mjs`) filters each language
to learnable words and caps packs at ~2,000 entries with three difficulty tiers
(starter/core/advanced). Full rules and statistics: docs/DATA_PIPELINE.md.

## Consequences

- Packs are 110–203 KB each, lazy-loaded per language — fast loads, quality questions.
- Deterministic output keeps builds reproducible and the pack-contract tests meaningful.
- The full raw data stays in `data/raw/` (committed, not deployed) so curation rules can
  evolve without re-fetching.
- Without frequency data, selection can include rare short words; a frequency-based
  prioritization is the natural v2.x improvement and will change pack contents (major
  version — daily seeds depend on tier composition).
