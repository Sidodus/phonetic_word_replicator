# Documentation

Operating docs for Phonetic Word Replicator v2. Start with the repo-root [AGENTS.md](../AGENTS.md)
for the working agreement.

| Document | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System shape, layering rules, session state machine, persistence, static-export specifics |
| [DATA_PIPELINE.md](DATA_PIPELINE.md) | Curation rules, tier tables, per-language statistics, known trade-offs |
| [GAME_DESIGN.md](GAME_DESIGN.md) | Modes, XP/level/combo tables, hints, achievements, streaks, sound |
| [I18N.md](I18N.md) | 11 UI locales vs 8 game languages, plural tokens, locale status matrix |
| [MIGRATION.md](MIGRATION.md) | v1→v2 breaking changes, storage migration contract, key map |
| [adr/](adr/README.md) | Architecture Decision Records (static export, packs, storage, i18n, audio) |

## Maintaining these docs

Docs are load-bearing (AGENTS.md §9): when a change alters behavior, numbers or contracts,
update the matching doc in the same change. ADRs are immutable — supersede, don't edit.
