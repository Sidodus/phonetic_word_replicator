/**
 * UI locale type — separate from game languages (the 8 Wiktionary dictionaries).
 * yo/ig/ha localize the interface only (see docs/I18N.md).
 */

export const UI_LOCALE_CODES = [
  "en",
  "fr",
  "de",
  "es",
  "it",
  "nl",
  "hi",
  "zh",
  "yo",
  "ig",
  "ha",
] as const;

export type UiLocale = (typeof UI_LOCALE_CODES)[number];
