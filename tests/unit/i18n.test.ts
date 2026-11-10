import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createTranslator,
  detectLocale,
  interpolate,
  isUiLocale,
  loadMessages,
  lookup,
  pluralVars,
  UI_LOCALES,
  UI_LOCALE_META,
} from "@/lib/i18n";
import en from "../../messages/en.json";

const MESSAGES_DIR = path.resolve(__dirname, "../../messages");

/** Collect leaf-key paths of a message tree. */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

/** Placeholders like {name} inside a string. */
function placeholders(value: string): string[] {
  const matches = value.match(/\{(\w+)\}/g) ?? [];
  return matches.filter((m) => m !== "{s}" && m !== "{e}" && m !== "{en}").sort();
}

describe("message catalogues (all 11 locales)", () => {
  const files = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  it("ships exactly the 11 supported locales", () => {
    expect(files).toEqual([...UI_LOCALES].map((l) => `${l}.json`).sort());
  });

  for (const locale of UI_LOCALES) {
    describe(locale, () => {
      const raw = fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8");
      const messages = JSON.parse(raw) as Record<string, unknown>;

      it("has exactly the same key structure as en.json", () => {
        expect(keyPaths(messages).sort()).toEqual(keyPaths(en).sort());
      });

      it("has no empty string values", () => {
        const empty = keyPaths(messages).filter((k) => lookup(messages, k) === "");
        expect(empty).toEqual([]);
      });

      it("preserves non-suffix placeholders from en.json", () => {
        const missing: string[] = [];
        for (const key of keyPaths(en)) {
          const expected = placeholders(lookup(en, key) ?? "");
          const actual = placeholders(lookup(messages, key) ?? "");
          if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            missing.push(`${key}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
          }
        }
        expect(missing).toEqual([]);
      });

      it("keeps the phonetic transcription and protected literals", () => {
        expect(lookup(messages, "app.phonetic")).toBe("/fəˈnɛtɪk wɜːd ɹɛplɪkeɪtə/");
        expect(lookup(messages, "app.v2")).toBe("v2");
        expect(lookup(messages, "standard.xsampa")).toBe("X-SAMPA");
        expect(lookup(messages, "credits.author")).toBe("Saheed Odulaja");
      });

      it("preserves the phonetic samples with correct escaping", () => {
        expect(lookup(messages, "settings.xsampaDesc")).toContain('/"dIkS(@)n(@)r\\I/');
        expect(lookup(messages, "settings.ipaDesc")).toContain("/ˈdɪkʃ(ə)n(ə)ɹɪ/");
      });
    });
  }
});

describe("runtime", () => {
  it("isUiLocale accepts supported codes only", () => {
    expect(isUiLocale("en")).toBe(true);
    expect(isUiLocale("yo")).toBe(true);
    expect(isUiLocale("xx")).toBe(false);
    expect(isUiLocale("EN")).toBe(false);
  });

  it("lookup resolves dot paths and rejects non-strings", () => {
    expect(lookup(en, "nav.home")).toBe("Home");
    expect(lookup(en, "app.name")).toContain("Phonetic Word Replicator");
    expect(lookup(en, "no.such.key")).toBeUndefined();
    expect(lookup(en, "nav")).toBeUndefined(); // non-leaf
  });

  it("interpolate replaces known vars and leaves unknown ones", () => {
    expect(interpolate("{count} words", { count: 5 })).toBe("5 words");
    expect(interpolate("{count} words", {})).toBe("{count} words");
  });

  it("createTranslator falls back to English, then to the key", () => {
    const t = createTranslator({ nav: { home: "İlé" } }, en);
    expect(t("nav.home")).toBe("İlé");
    expect(t("nav.play")).toBe("Play"); // fallback
    expect(t("totally.missing.key")).toBe("totally.missing.key");
  });

  it("detectLocale maps browser languages to supported locales", () => {
    const stub = (langs: readonly string[]) =>
      vi_stubNavigator(langs);
    stub(["fr-FR", "fr", "en"]);
    expect(detectLocale()).toBe("fr");
    stub(["yo-NG"]);
    expect(detectLocale()).toBe("yo");
    stub(["pt-BR"]);
    expect(detectLocale()).toBe("en");
    stub([]);
    expect(detectLocale()).toBe("en");
  });

  it("pluralVars emits the right suffix token per locale", () => {
    expect(pluralVars("en", 1)).toEqual({ s: "" });
    expect(pluralVars("en", 3)).toEqual({ s: "s" });
    expect(pluralVars("de", 1)).toEqual({ e: "" });
    expect(pluralVars("de", 3)).toEqual({ e: "e" });
    expect(pluralVars("nl", 1)).toEqual({ en: "" });
    expect(pluralVars("nl", 3)).toEqual({ en: "en" });
    expect(pluralVars("it", 1)).toEqual({ s: "o" });
    expect(pluralVars("it", 3)).toEqual({ s: "i" });
    expect(pluralVars("zh", 3)).toEqual({ s: "", e: "", en: "" });
  });

  it("loadMessages returns every locale's catalogue", async () => {
    for (const locale of UI_LOCALES) {
      const messages = await loadMessages(locale);
      expect(lookup(messages, "nav.home")).toBeTruthy();
      expect(UI_LOCALE_META[locale].endonym.length).toBeGreaterThan(0);
    }
  });
});

function vi_stubNavigator(langs: readonly string[]): void {
  Object.defineProperty(window, "navigator", {
    value: { languages: langs, language: langs[0] },
    configurable: true,
    writable: true,
  });
}
