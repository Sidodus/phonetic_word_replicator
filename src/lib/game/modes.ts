/**
 * Static metadata for game modes, game languages and UI locales.
 */

import type { GameMode, LanguageCode, PhoneticStandard } from "@/types/game";

// ---------------------------------------------------------------------------
// Game languages (curated Wiktionary packs)
// ---------------------------------------------------------------------------

export interface GameLanguageMeta {
  code: LanguageCode;
  /** Native name shown on the language picker. */
  endonym: string;
  /** BCP-47 tag for Web Speech API pronunciation. */
  ttsLocale: string;
  /** Path (under /img/flags) of the legacy flag artwork. */
  flag: string;
}

export const GAME_LANGUAGE_META: Record<LanguageCode, GameLanguageMeta> = {
  en: { code: "en", endonym: "English", ttsLocale: "en-US", flag: "English.jpeg" },
  fr: { code: "fr", endonym: "Français", ttsLocale: "fr-FR", flag: "french-flag.jpg" },
  de: { code: "de", endonym: "Deutsch", ttsLocale: "de-DE", flag: "German.jpg" },
  es: { code: "es", endonym: "Español", ttsLocale: "es-ES", flag: "Spanish.jpg" },
  it: { code: "it", endonym: "Italiano", ttsLocale: "it-IT", flag: "italian.jpg" },
  nl: { code: "nl", endonym: "Nederlands", ttsLocale: "nl-NL", flag: "Dutch.jpg" },
  hi: { code: "hi", endonym: "हिन्दी", ttsLocale: "hi-IN", flag: "Hindi.jpg" },
  zh: { code: "zh", endonym: "中文", ttsLocale: "zh-CN", flag: "Chinese.jpg" },
};

export const GAME_LANGUAGE_CODES = Object.keys(GAME_LANGUAGE_META) as LanguageCode[];

/** Pronunciation display for the dictionary-word header (v1 easter egg kept). */
export const STANDARD_SAMPLE: Record<PhoneticStandard, string> = {
  IPA: "/ˈdɪkʃ(ə)n(ə)ɹɪ/",
  "X-SAMPA": '/"dIkS(@)n(@)r\\I/',
};

/** i18n key suffix per standard ("X-SAMPA" lowercases to "x-sampa", not "xsampa"). */
export function standardI18nKey(standard: PhoneticStandard): "ipa" | "xsampa" {
  return standard === "IPA" ? "ipa" : "xsampa";
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

export interface GameModeMeta {
  id: GameMode;
  icon: string;
  i18nKey: string;
  /** Questions per session. */
  sessionLength: number;
  /** Seconds per speed round; 0 = untimed. */
  timeLimitSeconds: number;
  /** The mode listens to TTS instead of showing phonetic text. */
  audioDriven: boolean;
  /** The mode presents multiple-choice options. */
  multipleChoice: boolean;
}

export const GAME_MODE_META: Record<GameMode, GameModeMeta> = {
  classic: {
    id: "classic",
    icon: "🔤",
    i18nKey: "classic",
    sessionLength: 15,
    timeLimitSeconds: 0,
    audioDriven: false,
    multipleChoice: false,
  },
  choice: {
    id: "choice",
    icon: "🃏",
    i18nKey: "choice",
    sessionLength: 15,
    timeLimitSeconds: 0,
    audioDriven: false,
    multipleChoice: true,
  },
  listen: {
    id: "listen",
    icon: "🎧",
    i18nKey: "listen",
    sessionLength: 12,
    timeLimitSeconds: 0,
    audioDriven: true,
    multipleChoice: false,
  },
  speed: {
    id: "speed",
    icon: "⚡",
    i18nKey: "speed",
    sessionLength: 60, // generous upper bound; the round ends on timer expiry
    timeLimitSeconds: 60,
    audioDriven: false,
    multipleChoice: false,
  },
  daily: {
    id: "daily",
    icon: "🗓️",
    i18nKey: "daily",
    sessionLength: 10,
    timeLimitSeconds: 0,
    audioDriven: false,
    multipleChoice: false,
  },
  review: {
    id: "review",
    icon: "🔁",
    i18nKey: "review",
    sessionLength: 12,
    timeLimitSeconds: 0,
    audioDriven: false,
    multipleChoice: false,
  },
};

export const GAME_MODE_IDS = Object.keys(GAME_MODE_META) as GameMode[];
