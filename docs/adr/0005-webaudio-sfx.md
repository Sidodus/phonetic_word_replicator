# ADR-0005: Web Audio synthesized sound effects

- Status: Accepted (2026-11-10)

## Context

v1 shipped two notification MP3s ("Facebook Chat Pop", "Facebook Message") — proprietary
sounds with unclear licensing, loaded as assets. The rewrite needed feedback sounds
(correct/wrong/reveal/tick/levelup).

## Decision

Synthesize all effects with the Web Audio API (short oscillator envelopes defined in
`src/lib/audio/sfx.ts`). AudioContext is created lazily on first user gesture; every call is
guarded — audio is a bonus, never a crash.

## Consequences

- Zero audio assets, zero licensing questions, ~4 KB of code instead of files.
- Sounds are synthesized (chiptune-adjacent) rather than sampled; if the owner wants rich
  audio later, add licensed assets behind the same `SfxPlayer` interface.
- Browser autoplay policy respected: context resumes on user-gesture-driven playback.
