/**
 * Lightweight typed i18n runtime.
 *
 * Why not next-intl/react-intl (ADR-0004): the game is a fully client-side
 * static export whose locale lives in localStorage (not the URL); messages are
 * small, lazy-loaded per locale, and need simple {var} interpolation. A ~100
 * line runtime with full type-safety beats a routing-oriented dependency here.
 *
 * Fallback chain: requested locale → English → the key itself (never a crash,
 * never an empty label in production).
 */

import type { UiLocale } from "./locales";

export type { UiLocale } from "./locales";


export type Messages = Record<string, unknown>;

export const UI_LOCALES: readonly UiLocale[] = [
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

export function isUiLocale(value: string): value is UiLocale {
  return (UI_LOCALES as readonly string[]).includes(value);
}

export interface UiLocaleMeta {
  code: UiLocale;
  endonym: string;
  /** BCP-47 tag for date formatting etc. */
  tag: string;
}

export const UI_LOCALE_META: Record<UiLocale, UiLocaleMeta> = {
  en: { code: "en", endonym: "English", tag: "en" },
  fr: { code: "fr", endonym: "Français", tag: "fr" },
  de: { code: "de", endonym: "Deutsch", tag: "de" },
  es: { code: "es", endonym: "Español", tag: "es" },
  it: { code: "it", endonym: "Italiano", tag: "it" },
  nl: { code: "nl", endonym: "Nederlands", tag: "nl" },
  hi: { code: "hi", endonym: "हिन्दी", tag: "hi" },
  zh: { code: "zh", endonym: "中文", tag: "zh-CN" },
  yo: { code: "yo", endonym: "Yorùbá", tag: "yo" },
  ig: { code: "ig", endonym: "Igbo", tag: "ig" },
  ha: { code: "ha", endonym: "Hausa", tag: "ha-Hausa" },
};

const messageLoaders: Record<UiLocale, () => Promise<{ default: Messages }>> = {
  en: () => import("../../../messages/en.json"),
  fr: () => import("../../../messages/fr.json"),
  de: () => import("../../../messages/de.json"),
  es: () => import("../../../messages/es.json"),
  it: () => import("../../../messages/it.json"),
  nl: () => import("../../../messages/nl.json"),
  hi: () => import("../../../messages/hi.json"),
  zh: () => import("../../../messages/zh.json"),
  yo: () => import("../../../messages/yo.json"),
  ig: () => import("../../../messages/ig.json"),
  ha: () => import("../../../messages/ha.json"),
};

/** Load the message catalogue for a locale (bundled per-locale by webpack). */
export async function loadMessages(locale: UiLocale): Promise<Messages> {
  const loader = messageLoaders[locale];
  const mod = await loader();
  return mod.default;
}

/** Browser language detection → best supported locale, defaulting to "en". */
export function detectLocale(): UiLocale {
  if (typeof navigator === "undefined") {
    return "en";
  }
  const candidates = navigator.languages ?? [navigator.language];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const base = candidate.toLowerCase().split("-")[0];
    if (isUiLocale(base)) {
      return base;
    }
  }
  return "en";
}

/** Resolve a dot-path key against a message tree. */
export function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Replace `{name}` placeholders. Unknown placeholders are left as-is. */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export interface TranslateFn {
  (key: string, vars?: Record<string, string | number>): string;
}

/** Build a translate function with English fallback. */
export function createTranslator(messages: Messages, fallback: Messages = {}): TranslateFn {
  return (key, vars) => {
    const template = lookup(messages, key) ?? lookup(fallback, key) ?? key;
    return interpolate(template, vars);
  };
}

/**
 * Plural-suffix vars for the `{s}`-style suffix placeholders.
 *
 * Locales express the singular/plural difference differently:
 *   en/fr/es → "{s}" suffix ("attempt{s}"), it → "{s}" as final vowel
 *   ("tentativ{s}" → tentativo/tentativi), de → "{e}", nl → "{en}",
 *   hi/zh/yo/ig/ha → no suffix token at all.
 * Pass the result into `t()` alongside other vars; unused tokens are ignored.
 */
export function pluralVars(locale: UiLocale, count: number): Record<string, string> {
  switch (locale) {
    case "de":
      return { e: count === 1 ? "" : "e" };
    case "nl":
      return { en: count === 1 ? "" : "en" };
    case "it":
      return { s: count === 1 ? "o" : "i" };
    case "en":
    case "fr":
    case "es":
      return { s: count === 1 ? "" : "s" };
    default:
      return { s: "", e: "", en: "" };
  }
}
