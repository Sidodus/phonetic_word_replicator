# ADR-0001: Fully client-side static export

- Status: Accepted (2026-11-10)
- Deciders: owner + agent (rewrite planning session)

## Context

v1 was a static GitHub Pages site: no backend, progress in localStorage. The v2 rewrite
needed to decide between preserving that model and adding API routes + a database.

## Decision

Next.js with `output: "export"` — a pure static bundle served from any static host. All game
state lives in the browser (see ADR-0003).

## Consequences

- Free hosting (GitHub Pages/Vercel static), no ops, no data to protect, works offline-ish
  after first load.
- Cross-device sync, global leaderboards and server-side word data are out of scope until a
  backend ADR exists. The repository layer (`lib/game/dictionary.ts`, `lib/storage/`) is the
  intended seam if that day comes.
- `next/image` optimization, ISR, server components with dynamic data are unavailable;
  dynamic-route prerendering uses `generateStaticParams`/`Suspense` patterns.
- GitHub Pages project sites require `NEXT_PUBLIC_BASE_PATH=/phonetic_word_replicator`.
