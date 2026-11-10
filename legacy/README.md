# legacy/ — Frozen v1 reference

This directory preserves the original 2019 Phonetic Word Replicator: the vanilla-JS
controllers (`english.js`, `hindi.js`, … — one near-identical engine per language),
`app.js` (UI translation layer), the Bootstrap 4 bundle, the original `index.html`, and the
two notification sound files.

**It is not built, deployed, or referenced by v2.** It exists as a behavioural reference for
the v1 mechanics (3-attempt flow, colour coding, hint behaviour, storage keys) — see
`docs/MIGRATION.md` for the documented contract.

Known v1 quirks (kept here for history, fixed in v2 and regression-tested):

- Hint mask used `([i] % 2) !== 1` — an array literal is always truthy, so both hint
  patterns revealed the same characters.
- `JSON.parse(hintsStorage)` called on a number (works by accident, but is wrong).
- Win-rate stats produced `NaN` when opened before the first attempt.
- The Enter key was disabled app-wide instead of submitting.
- The session reloaded the page when the word list was exhausted.
- UI translations contained artifacts ("Spinish" for Spanish, duplicated selector keys).

Do not "modernize" files here — v2 replaces them entirely.
