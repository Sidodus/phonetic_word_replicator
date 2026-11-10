# Architecture

> Status: current for v2.0.0. Update alongside meaningful structural change (see AGENTS.md §9).

Phonetic Word Replicator v2 is a **fully client-side static site**. There is no server, no
database, no API. Everything — game logic, statistics, progression — lives in the browser.

```
┌────────────────────────── Build time ──────────────────────────┐
│ data/raw/wiktionary-json/*.json   (31 MB, 8 languages)         │
│        │  scripts/curate-dictionary.mjs (deterministic)        │
│        ▼                                                       │
│ public/dictionaries/{en,zh,nl,fr,de,hi,it,es}.json + index.json│
└────────────────────────────────────────────────────────────────┘
                          │  (shipped as static assets)
┌────────────────────────── Runtime (browser) ───────────────────┐
│ Next.js static export (out/)                                   │
│  Routes: / (setup+home) · /play (game) · /stats (dashboard)    │
│                                                                │
│  components ──▶ lib/game/session.ts (pure state machine)       │
│      │                 │                                       │
│      │                 ├── lib/game/* (rng, scoring, hints,    │
│      │                 │    questions, achievements, streaks)  │
│      │                 └── lib/game/dictionary.ts (fetch+validate)
│      │                                                         │
│      ├──▶ lib/storage/profile.ts (Zustand + localStorage)      │
│      │        └── v1-migration.ts (legacy key import)          │
│      ├──▶ lib/speech/tts.ts (Web Speech, optional)             │
│      └──▶ lib/audio/sfx.ts (Web Audio synthesis, optional)     │
└────────────────────────────────────────────────────────────────┘
```

## Layering rules

`types/game.ts` → `lib/*` → `components/*` → `app/*`. The engine never imports React or
browser globals; the components never re-implement game rules. This is what makes the rule
set unit-testable at ~97% coverage without a DOM.

## The session state machine

`src/lib/game/session.ts` is the single authority on game rules. It consumes events
(`answer`, `skip`, `hint`, `continue`, `timeout`) and produces a new immutable
`SessionState` plus an `AnswerResult` (used for sound/XP display). The React layer
(`GamePage`) is a thin orchestrator: pack loading, timing, sound, speech, rendering.

Per-mode behavior lives in the machine, keyed off `mode`:

| Mode | Attempts | Hints | End condition |
|---|---|---|---|
| classic | 3 | yes | questions exhausted |
| choice | 3 (option picks) | no | questions exhausted |
| listen | 3 | yes | questions exhausted |
| speed | 1 | no | 60s timer OR 60 questions |
| daily | 3 | yes | 10 seeded questions |

## Persistence

One namespaced localStorage key: `pwr.v2.profile` (Zustand persist, storage schema v2).
Contents: settings, XP (total + per language), per-language outcome counters, capped history
(300), achievements, daily-calendar (120 entries), streaks, speed bests. Best-effort import
of v1 keys runs once (flag `v1ImportedAt`) — see MIGRATION.md.

Rationale for localStorage over IndexedDB: profile data is bounded by caps (~150 KB worst
case), synchronous access keeps the reducer flow simple, and it survives file://-adjacent
static hosting. IndexedDB remains the escape hatch if caps ever grow (ADR-0003).

## Rendering & hydration

All routes are client components inside `AppShell` (navbar + i18n + footer). Pages prerender
at build time with the empty profile; persisted state hydrates in the browser. Anything
rendering persisted state goes through `useHydrated()` to avoid hydration mismatches. The
i18n provider renders a spinner until messages load — raw keys never flash.

## Static export specifics

- `output: "export"` + `trailingSlash: true` — every route is an `index.html` on any host.
- `/play` reads `useSearchParams` → wrapped in `<Suspense>` for prerendering.
- GitHub Pages project sites need `NEXT_PUBLIC_BASE_PATH=/phonetic_word_replicator`; the
  dictionary loader (`lib/game/dictionary.ts` `BASE_PATH`) and asset URLs respect it.
- `next/image` optimization is disabled (`images.unoptimized`) as required by static export.
