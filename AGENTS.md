# AGENTS.md — Phonetic Word Replicator v2

**Operating manual for AI agents and human contributors working on this repository.**
Read this file first, every session. It encodes the project's architecture, invariants,
quality gates and hard-won environment lessons. Where this file and convenience conflict,
this file wins.

---

## 1. Mission & product identity

**Phonetic Word Replicator** (`/fəˈnɛtɪk wɜːd ɹɛplɪkeɪtə/`) is a browser game that teaches
spelling through phonetic transcription (IPA and X-SAMPA) across 8 Wiktionary-derived
language packs. It was created by **Saheed Odulaja (GitHub: Sidodus)** in 2019 as a vanilla-JS
exercise and rebuilt in 2026 as v2.

Non-negotiable product values:

1. **Encouragement over punishment.** The game tracks improvement, not failure — inherited
   from v1. Never add shaming mechanics; stats exist to show progress.
2. **Zero-friction access.** No accounts, no server, no install. The game must keep working
   as a pure static site (see ADR-0001).
3. **Low-barrier entry, high skill ceiling.** Multiple Choice and Listen & Spell exist for
   students intimidated by phonetic symbols; Classic and Speed serve the committed.
4. **Author & data attribution is part of the product.** Wiktionary/wikt2pron credits and the
   author byline stay visible (home footer + About section).

Current version: **2.0.0** (package.json is the single source of truth). The rewrite from
v1 is a **breaking change** — see `docs/MIGRATION.md` before touching storage code.

## 2. Tech stack (do not swap without an ADR)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router), **static export** | `output: "export"` in next.config.ts |
| Language | TypeScript, `strict: true` | No `any` in new code; no non-null `!` on DOM queries |
| UI | React 19 + **react-bootstrap 2.x / Bootstrap 5.3** | Owner requirement — keep Bootstrap/ReactBootstrap |
| State | Zustand 5 + persist middleware | Single store, key `pwr.v2.profile` (ADR-0003) |
| Styling | Bootstrap dark theme + CSS custom properties | `data-bs-theme="dark"`; brand colors in globals.css |
| i18n | Custom typed runtime (`src/lib/i18n`) | 11 locales; ADR-0004 explains why not next-intl |
| Data | Curated JSON packs in `public/dictionaries` | Built by `scripts/curate-dictionary.mjs` (ADR-0002) |
| Speech | Web Speech API (feature-detected) | Never a hard dependency |
| SFX | Web Audio API synthesis | No audio asset files (v1 MP3s removed deliberately) |
| Tests | Vitest 3 + Testing Library + Playwright | see §7 |

## 3. Commands

```bash
npm run dev            # dev server (http://localhost:3000)
npm run build          # static export → out/
npm start              # serve out/ on http://127.0.0.1:4173 (matches Playwright config)
npm run lint           # ESLint (flat config)
npm run typecheck      # tsc --noEmit
npm test               # Vitest (unit + component)
npm run test:coverage  # Vitest with coverage gate (src/lib/**: 90/85/90)
npm run test:e2e       # Playwright against out/ — run `npm run build` first!
npm run data:curate    # rebuild public/dictionaries from data/raw (deterministic)
npm run data:validate  # validate shipped packs against the schema
npm run verify         # lint + typecheck + test + data:validate + build — run before declaring done
```

`npm run verify` passing is the **definition of done** for any change. Never report work as
complete with failing or skipped tests.

## 4. Architecture map

```
data/raw/wiktionary-json/     Raw source data (31MB, build-time only, never deployed)
scripts/curate-dictionary.mjs Deterministic curation pipeline (ADR-0002)
public/dictionaries/          Shipped packs (~200KB/lang) + index.json — GENERATED, don't hand-edit
public/img/flags/             Legacy flag artwork reused by the language picker
legacy/                       Frozen v1 reference (vanilla JS) — not built, not deployed
messages/*.json               11 UI locale catalogues (en.json is canonical)
src/types/game.ts             Domain types — the contract between pipeline/engine/UI
src/lib/game/                 PURE game engine (no React, no browser APIs)
  rng.ts                      Seeded RNG (mulberry32), date-key math (local-noon anchored)
  normalize.ts                Answer matching (NFC, case-fold, optional accent-fold)
  hint.ts                     Letter masks + hint penalty (v1 `[i]%2` bug regression-guarded)
  scoring.ts                  XP, levels, combo, speed multiplier, NaN-safe stats
  streaks.ts                  Daily-challenge streak (timezone-safe)
  question-generator.ts       Word selection + multiple-choice distractors
  session.ts                  Session state machine (pure reducer) — ALL game rules
  achievements.ts             16 achievements, pure evaluation
  modes.ts                    Mode + language + phonetic-standard metadata
  dictionary.ts               Pack fetching/validation/caching
src/lib/storage/              Zustand profile store + v1 localStorage migration
src/lib/speech/ , src/lib/audio/   TTS + WebAudio SFX (feature-detected, fail-soft)
src/lib/i18n/                 Runtime + provider
src/app/                      Routes: / (home), /play, /stats
src/components/               Client components (home/, game/, stats/)
docs/                         You are expected to keep docs/ current (see §9)
```

**Dependency rule:** `types` ← `lib` ← `components` ← `app`. Engine code must never import
from components or app. Storage may import engine; never the reverse.

### Core invariants (breaking these = bug, regardless of tests)

1. **Profile XP = Σ record.xpEarned.** Hint costs are charged inline per record
   (`session.ts`), never re-applied at session end.
2. **Achievements unlock exactly once.** Unlocks are computed against the post-session
   snapshot and filtered against existing unlocks. Never write to `achievements` elsewhere.
3. **Combo = consecutive first-try corrects.** Broken by: wrong-through-3, skip. A mid-question
   miss does not reset the display until the question ends.
4. **Daily challenges are pure functions of (dateKey, language, pack version).** Any change to
   `dailySeedFor` invalidates historical daily calendars — needs a major version bump.
5. **All randomness flows through `Rng`.** No bare `Math.random()` in engine or question code.
6. **Every pronunciation display has both standards available.** IPA ⇄ X-SAMPA toggling must
   work mid-session without losing state.
7. **localStorage keys are namespaced `pwr.v2.*`.** v1 keys are read-only (migration only).

## 5. Data pipeline contract

`data:curate` is deterministic: identical raw inputs ⇒ byte-identical packs. Never edit
`public/dictionaries/*.json` by hand — change `scripts/curate-dictionary.mjs` and re-run.
Rules (full detail: `docs/DATA_PIPELINE.md`):

- Entries: `{ w, ipa, xs, tier }` — compact keys, wrappers stripped, first pronunciation only.
- Tiers: latin ≤4 starter / 5–8 core / 9–12 advanced; zh 2-char starter / 3 core / 4 advanced
  (single CJK chars excluded — radical noise, no frequency signal).
- Caps: 700/800/500 per tier; small languages (hi, it) ship their full pool.
- `data:validate` (and the pack contract tests) must stay green after any pipeline change.

When adding a game language: add raw JSON to `data/raw/wiktionary-json/`, extend `LANGUAGES`
+ `LANG_SCRIPT` in the script, add `GAME_LANGUAGE_META` in `modes.ts`, re-run curation,
extend the i18n `language` strings if needed, and update the pack tests' language list
(`src/types/game.ts` `GAME_LANGUAGES` drives everything).

## 6. i18n policy

- `messages/en.json` is canonical. **Any UI string must exist there first**, then be translated
  to all other 10 locales in the same change — key-structure parity is CI-tested
  (`tests/unit/i18n.test.ts` walks every locale against en).
- Placeholders: `{name}` interpolation only. Plural suffixes use the `{s}`-style token with
  **per-locale vars from `pluralVars()`** — never hardcode "s". hi/zh/yo/ig/ha carry no token.
- Yorùbá, Igbo, Hausa localize the **UI only** (no game dictionaries — see docs/I18N.md).
- Adding a new UI locale: add the catalogue + `UI_LOCALES`/`UI_LOCALE_META` + loader entry +
  a parity test pass. Follow the SPEC-first habit from the owner's number-to-words project:
  non-trivial grammar decisions get documented in docs/I18N.md.

## 7. Testing policy — "no bug survives the session"

| Layer | Location | What belongs there |
|---|---|---|
| Unit (pure) | `tests/unit/` | Engine, storage, migration, i18n runtime, shipped-pack contract |
| Component | `tests/component/` | Play flows per mode, dashboard, settings — mocked fetch/speech |
| E2E | `e2e/` | Built-site smoke (real packs, real browser) — build first |

Rules:

- **Every bug fix ships with a regression test** that fails without the fix.
- Engine changes update unit tests first; UI-visible numbers (XP, achievements) must match
  `docs/GAME_DESIGN.md` — when they disagree, fix code or docs, never leave the drift.
- Coverage gate: `src/lib/**` ≥ 90% statements/lines/functions, ≥ 85% branches (vitest.config.ts).
  Do not lower thresholds to make a PR pass — add tests or justify an exclusion in an ADR.
- Fake-timer tests: create intervals under fake timers (enable `vi.useFakeTimers()` before the
  render) and wrap `advanceTimersByTimeAsync` in `act()`, or React's scheduler never flushes.
- Never `it.skip` / `describe.skip` in committed code. A test that can't run reliably gets
  deleted with a note in the PR, not skipped.
- Zustand store tests: reset with `setState({ ...createEmptyProfile() })` — **merge, not
  replace**; `replace=true` wipes the action functions.

## 8. Definition of done

1. `npm run verify` fully green (lint, typecheck, tests + coverage, pack validation, build).
2. `npm run test:e2e` green if the change touches flows, packaging or deployment.
3. Docs updated when behavior/numbers/contracts changed (§9).
4. No new ESLint suppressions without a comment explaining why the rule is wrong here.
5. Version bumped per §10 when the change is user-visible.

## 9. Documentation discipline

`docs/` is load-bearing. Keep it truthful — an outdated doc is a bug:

- `docs/ARCHITECTURE.md` — system shape and data flow.
- `docs/DATA_PIPELINE.md` — curation rules, tier tables, per-language stats.
- `docs/GAME_DESIGN.md` — modes, XP/level/combo tables, achievements, hint policy.
- `docs/I18N.md` — locale matrix, translation conventions, yo/ig/ha status.
- `docs/MIGRATION.md` — v1→v2 breaking changes + storage migration contract.
- `docs/adr/` — Architecture Decision Records; **any decision that removes an option**
  (stack swap, storage change, pipeline change) needs one. ADRs are immutable: supersede,
  don't edit.

## 10. Versioning & releases

- Semver. `2.x` is the current line. **User-visible behavior or stored-data changes bump the
  minor/patch; storage schema or daily-seed changes bump the major.**
- The static deploy target is GitHub Pages
  (`https://sidodus.github.io/phonetic_word_replicator/`) → builds there must set
  `NEXT_PUBLIC_BASE_PATH=/phonetic_word_replicator`. Local/Vercel builds leave it unset.
- Deploy runbook: commit → push → build with the base path → publish `out/` (Pages settings or
  Actions). The owner runs releases; agents prepare them.

## 11. Environment pitfalls (this machine — Windows / Git Bash)

Hard-won; do not re-learn them:

1. **Extensionless relative imports in Next.** `import "./types.js"` passes `tsc` but webpack
   fails to resolve it. Use `"./types"`. (Owner-verified across three repos.)
2. **Never `cd` into build/output dirs** (`out/`, `.next/`) on Windows — the shell holds an
   EBUSY lock and the next build's `rmdir` fails. Clean from the repo root.
3. **`npm install` after any scripted `package.json` edit** (including this session's script
   tweaks) — stale lockfiles break `npm ci` and fresh clones.
4. **Full absolute paths in shell commands**; the terminal's cwd drifts between calls. Prefer
   `cd "/c/Users/HP/Desktop/My Apps/phonetic_word_replicator" && …` in every command.
5. **Git "dubious ownership"** is already resolved via `safe.directory` — if it reappears after
   a Windows update, re-add the exception; don't change repo ownership.
6. **Long-running `next dev` servers** can drop changes until restarted; prefer rebuild +
   static serve for verification.
7. **`playwright install chromium`** outputs nothing on success — check exit code, not output.
8. Never kill processes belonging to MATCHMASTER-AgentOS training runs (they run concurrently
   on the owner's machine).

## 12. Interaction conventions

- The owner is a professional JS developer and the original author; treat product history
  (v1, the number-to-words locale work) as requirements context, not trivia.
- Propose game-mechanics changes with exact numbers (XP tables, thresholds) in GAME_DESIGN.md
  form before implementing — the owner tunes numbers.
- Do not deploy, publish, or push without an explicit ask.
- When stuck between two reasonable designs, prefer the one that keeps the game deployable as
  a pure static site.
