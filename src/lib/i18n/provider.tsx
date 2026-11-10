"use client";

/**
 * i18n React provider: resolves the UI locale (setting → browser → en),
 * lazy-loads its messages, exposes a typed translate function.
 *
 * While messages load, the provider renders `fallback` (a skeleton) so no
 * raw keys ever flash on screen.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createTranslator,
  detectLocale,
  isUiLocale,
  loadMessages,
  pluralVars,
  type Messages,
  type TranslateFn,
} from "./index";
import type { UiLocale } from "./locales";

export { pluralVars };

interface I18nContextValue {
  locale: UiLocale;
  /** Current messages; falls back to English for missing keys. */
  t: TranslateFn;
  changeLocale: (locale: UiLocale | "auto") => Promise<void>;
  loaded: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLocale(stored: string | null): UiLocale {
  if (stored && isUiLocale(stored)) return stored;
  return detectLocale();
}

export interface I18nProviderProps {
  children: ReactNode;
  /** Selector for the stored "auto" | locale preference. */
  getStoredLocale?: () => string | null;
  fallback?: ReactNode;
}

export function I18nProvider({ children, getStoredLocale, fallback }: I18nProviderProps) {
  const [locale, setLocale] = useState<UiLocale>("en");
  const [messages, setMessages] = useState<Messages>({});
  const [english, setEnglish] = useState<Messages>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = getStoredLocale?.() ?? null;
    const initial = resolveInitialLocale(stored);
    (async () => {
      const [target, en] = await Promise.all([
        loadMessages(initial),
        initial === "en"
          ? Promise.resolve({} as Messages)
          : loadMessages("en").then((m) => m.default as Messages),
      ]);
      if (cancelled) return;
      setLocale(initial);
      setMessages(target);
      setEnglish(en);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // getStoredLocale is read once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLocale = useCallback(async (next: UiLocale | "auto") => {
    const resolved = next === "auto" ? detectLocale() : next;
    const [target, en] = await Promise.all([
      loadMessages(resolved),
      resolved === "en"
        ? Promise.resolve({} as Messages)
        : loadMessages("en").then((m) => m.default as Messages),
    ]);
    setLocale(resolved);
    setMessages(target);
    setEnglish(en);
    setLoaded(true);
  }, []);

  const t = useMemo(() => createTranslator(messages, english), [messages, english]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, t, changeLocale, loaded }),
    [locale, t, changeLocale, loaded],
  );

  return (
    <I18nContext.Provider value={value}>{loaded ? children : fallback}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return ctx;
}
