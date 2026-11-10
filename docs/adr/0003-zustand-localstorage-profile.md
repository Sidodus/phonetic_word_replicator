# ADR-0003: Zustand + localStorage for the player profile

- Status: Accepted (2026-11-10)

## Context

v1 scattered progress across ~14 ad-hoc localStorage keys per language. v2 needed a single,
validated, testable persistence layer. Options: raw localStorage, IndexedDB (idb-keyval),
a backend.

## Decision

One Zustand store with the persist middleware, under the single key `pwr.v2.profile`, with
hard caps (history 300 records, daily calendar 120 entries) keeping the document ≤ ~150 KB.

## Consequences

- Synchronous, simple, SSR/prerender-safe (storage shim when `window` is absent), trivially
  testable (merge-based `setState` resets — `replace=true` wipes actions; regression-noted).
- Hydration gating: UI reading persisted state goes through `useHydrated()` to avoid
  static-export hydration mismatches.
- If profile data ever grows beyond caps (e.g. per-word spaced-repetition history), migrate
  to IndexedDB behind the same store API — no UI changes needed.
- v1 data is imported once, additively (docs/MIGRATION.md), then ignored.
