# Migration: v1 → v2

> Status: current for v2.0.0. Read before touching storage or seeding code.

## What changed (breaking)

| Area | v1 (2019) | v2 |
|---|---|---|
| Stack | Vanilla JS + Bootstrap 4 (8 duplicated engine files) | Next.js 15 + TypeScript + React-Bootstrap 5 |
| Storage | ~14 ad-hoc `localStorage` keys per language | One namespaced JSON document `pwr.v2.profile` |
| Question flow | NEXT → TRY AGAIN → LAST CHANCE buttons | One submit control + attempt dots; Enter submits |
| Hints | `confirm()` dialog; counter in storage | One hint per question, inline mask, 5 XP cost |
| Word source | Full raw Wiktionary JSON (31 MB) | Curated packs (~2,000 words/language) |
| UI languages | 8 (machine-translated) | 11 (incl. Yorùbá, Igbo, Hausa) |
| Stats | Win-rate modal only | Dashboard: outcomes, per-language, achievements, calendar |
| Sounds | Two notification MP3s | Web Audio synthesis |
| Deployment | GitHub Pages (vanilla) | Static export; still GitHub Pages-compatible |

## Storage migration

`src/lib/storage/v1-migration.ts` performs a **one-time, additive, best-effort** import the
first time v2 loads in a browser that still has v1 keys (the AppShell triggers it after
hydration; the store stamps `v1ImportedAt` so it never runs twice).

### v1 key map (verified against the legacy source)

v1 suffixed every key with the lowercase language **code** for all languages except English,
which used bare keys:

| v1 key | v2 target |
|---|---|
| `Correct Word On 1st Attempt(s)` | `languageStats[lang].correctFirst` + `globalCounts.correctFirst` |
| `Correct Word On 2nd Attempt(s)` | `…correctSecond` |
| `Correct Word On 3rd Attempt(s)` | `…correctThird` |
| `Wrong Word(s)` | `…wrong` |
| `Deducted Hint Point(s)` × 3 + `Hints Count(s)` | `…hintsUsed` (v1 stored triples + a 0–2 counter) |
| `All Attempted Questions(s)` | `history` (only when v2 history is empty) |
| `Phonetics Sound(s)` | `settings.standard` (first found) |
| `PWR Language` | (recognised; last-language hint) |

Suffix map: en → *(none)*, zh → `(zh)`, nl → `(nl)`, fr → `(fr)`, de → `(de)`, hi → `(hi)`,
it → `(it)`, es → `(es)`. (v1's UI label for Italian was "Italia"; its storage suffix was
still the code.)

### History mapping

v1 history items `{ previousWord, previousIpa, previousXSampa, className }` map to v2
`AttemptRecord`s via the Bootstrap background class:

- `bg-primary` → `correct-first` (attemptsUsed 1)
- `bg-warning` → `correct-second` (2)
- `bg-danger` → `correct-third` (3)
- `bg-secondary` → `failed` (0)

Migrated records carry `mode: "classic"`, `xpEarned: 0`, `tier: "core"` (unknown in v1), and
pronunciations are wrapper-stripped. Unreadable entries are skipped silently — a partially
corrupt v1 store must never block v2.

### Guarantees

1. **Additive only** — v2 counters gain v1 numbers; nothing is overwritten or lost.
2. **Once** — `v1ImportedAt` gates re-import; clearing it (tests only) re-runs the read.
3. **Fail-soft** — any per-key garbage reads as 0; corrupt JSON is skipped.
4. **No invented XP** — v1 had no XP concept; migrated history contributes counts, not XP.

## Reset semantics

"Reset all progress" (Stats → danger zone) wipes progress but **keeps settings** and keeps
`v1ImportedAt` set — a reset never resurrects v1 data as new.

## For developers

- Changing the storage schema → bump `version` in the persist config and add a `migrate`
  function; document in this file.
- Changing `dailySeedFor` invalidates historical daily calendars — major version.
- The v1 app itself is frozen under `legacy/` (not built, not deployed) as a behavioural
  reference; do not "modernize" files there.
