# ADR-0004: Custom i18n runtime instead of next-intl

- Status: Accepted (2026-11-10)

## Context

11 UI locales, ~150 keys each, no locale-prefixed routes, locale stored in localStorage,
static export. next-intl (and react-i18next) assume routing-integrated or provider-heavy
setups; their RSC orientation adds friction to a fully client-side static export.

## Decision

A ~100-line typed runtime (`src/lib/i18n/`): dot-path lookup, `{var}` interpolation,
per-locale lazy-loaded JSON chunks, English fallback, a React provider, and per-locale
plural-suffix vars (`pluralVars`). CI enforces full key-structure parity across locales.

## Consequences

- No dependency, no routing coupling, works identically in dev/build/test.
- We own pluralization: only suffix-style plurals are supported. Grammatical plurals beyond
  suffixes (e.g. Arabic classes) would need a real ICU engine — re-evaluate then.
- Parity tests make a forgotten translation a build failure, not a UI bug.
