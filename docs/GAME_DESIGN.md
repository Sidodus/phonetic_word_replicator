# Game Design

> Status: current for v2.0.0. Numbers here are the product contract — code and tests must
> match; change both together.

## Core loop (inherited from v1, modernized)

A question shows a word's pronunciation — **IPA or X-SAMPA**, switchable at any moment
(settings, or the badges on Home). The player spells the word. **Three attempts per word**:

| Attempt | Outcome label | Colour (v1 coding preserved) | XP |
|---|---|---|---|
| 1st | correct-first | blue (`primary`) | 10 base + 10 bonus + combo |
| 2nd | correct-second | yellow (`warning`) | 10 base + 5 bonus + combo |
| 3rd | correct-third | red (`danger`) | 10 base + 2 bonus + combo |
| miss ×3 | failed | grey (`secondary`) | 0 |
| skip | skipped | grey (`secondary`) | 0 |

After a third miss the correct answer is revealed for **5 seconds** (with optional TTS
pronunciation), then the session auto-advances. Enter submits; skipping is always available
and counted honestly in stats.

## Scoring

**XP per correct answer** = `10 (base) + attempt bonus (10/5/2) + combo bonus`.

**Combo** = consecutive first-try correct answers *within a session*. Bonus = `min(combo, 5) × 2`
XP, so the 5th+ consecutive first-try answer earns the full +10. The combo breaks on: a
question ending without a first-try correct, or a skip. Mid-question misses don't reset the
displayed streak — it stays "at risk" until the question resolves.

**Hints** — one per question, available in classic/listen/daily:
- Words with ≤ 4 graphemes: reveal the first character.
- Longer words: alternating character mask (both parity patterns exist; the v1 bug where
  both patterns revealed the same letters is regression-tested).
- **Cost: 5 XP**, charged inline when the hinted question is answered correctly — i.e. every
  3 hinted questions cost 15 XP ≈ one miss, preserving v1's "3 hints = 1 loss" spirit.

**Answer matching** — lenient by default (accents ignored: `cafe` = `café`), strict mode
opt-in in settings. Always case-insensitive, whitespace-collapsed, Unicode-NFC.

## Levels

XP to advance from level *L*: `50 × L`. Cumulative: `25 × L × (L−1)`. Level 10 = 2,250 XP;
cap at level 100. No XP is ever lost; levels never decrease.

## Modes

| Mode | Length | Timer | Distractors | Notes |
|---|---|---|---|---|
| **Classic Spelling** | 15 questions | — | — | The v1 experience, modernized. |
| **Multiple Choice** | 15 | — | 4 options, same tier preferred, similarity-scored (length ±2 + shared IPA characters) | Gentle entry; hints disabled. |
| **Listen & Spell** | 12 | — | — | Web Speech pronounces the word (replay button); no symbols shown. Graceful "unavailable" notice where TTS is missing. |
| **Speed Challenge** | up to 60 | 60 s | — | One attempt per word; correct → advance instantly; miss → streak resets, advance. Score = `10 × multiplier`, multiplier x1 → x2 at a 3-streak → x3 at a 6-streak (cap x3). Personal best stored per language. |
| **Daily Challenge** | 10 | — | — | Seeded from the local date + language — identical for every player that day. First completion of the day credits the calendar + streak; replays are practice-only. |

## Streaks

Daily-challenge completions feed the streak: same-day repeats don't extend; a next-day
completion extends; a skipped day resets to 1. Longest streak is tracked separately.
Date keys are local-calendar (`YYYY-MM-DD` at local noon) — DST-safe.

## Achievements (16)

| Achievement | Condition |
|---|---|
| 🎯 First Word | 1 correct answer |
| 📗 Word Collector | 50 correct |
| 📚 Vocabulary Builder | 250 correct |
| 🏆 Word Master | 1,000 correct |
| 💎 Flawless | Session of ≥ 10 words, all first-try |
| 🔥 On Fire | Best combo ≥ 5 |
| 🌋 Unstoppable | Best combo ≥ 12 |
| ⚡ Quick Thinker | Speed score ≥ 150 |
| 🚀 Lightning Speller | Speed score ≥ 300 |
| 📅 Habit Forming | Daily streak ≥ 3 |
| 🗓️ Week Warrior | Daily streak ≥ 7 |
| 🏅 Devoted Scholar | Daily streak ≥ 30 |
| 🌍 Polyglot | Played all 8 languages |
| 🎧 All Ears | Completed a Listen & Spell session |
| 🎖️ Seasoned | Reached level 10 |
| 🪄 Sharpshooter | ≥ 50 answered with ≥ 80% first-try accuracy |

Evaluation is a pure function of the post-session profile snapshot; unlocks are idempotent
and stamped with the unlock date.

## Sound & speech

- Correct answers: rising arpeggio; with a combo ≥ 3, a brighter fanfare. Wrong: low buzz.
  Reveal: soft tone. Speed: ticks in the last 5 s, buzzer at zero. Level-ups: fanfare.
- All effects are Web Audio synthesis — no asset files (v1 shipped two proprietary
  notification MP3s; removed for licensing cleanliness).
- TTS pronounces words (auto after reveal when enabled; always available via replay in
  Listen mode). Speech is a bonus: every call is feature-detected and fail-soft.

## Deliberate non-goals (v2)

- No accounts/servers — progress is per-browser.
- No per-question countdown in classic modes (v1's 5-second reveal window is the only clock).
- No multiplayer/global leaderboards (static-site constraint; revisit only with an ADR and a
  backend ADR).
