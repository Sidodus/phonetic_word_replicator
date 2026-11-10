import { describe, expect, it } from "vitest";
import {
  isAnswerCorrect,
  normalizeAnswer,
  normalizeStrict,
  stripDiacritics,
  stripPhoneticWrappers,
} from "@/lib/game/normalize";

describe("stripPhoneticWrappers", () => {
  it("strips slashes and brackets", () => {
    expect(stripPhoneticWrappers("/kæt/")).toBe("kæt");
    expect(stripPhoneticWrappers("[ˈbɑɹɾəɹ]")).toBe("ˈbɑɹɾəɹ");
    expect(stripPhoneticWrappers("t͡ɕʰy̯ɛn²¹⁴")).toBe("t͡ɕʰy̯ɛn²¹⁴");
  });

  it("trims whitespace", () => {
    expect(stripPhoneticWrappers("  /wɜːd/  ")).toBe("wɜːd");
  });

  it("leaves inner slashes intact", () => {
    expect(stripPhoneticWrappers('/"dIkS(@)n(@)r\\I/')).toBe('"dIkS(@)n(@)r\\I');
  });
});

describe("stripDiacritics", () => {
  it("removes Latin diacritics", () => {
    expect(stripDiacritics("café")).toBe("cafe");
    // ß has no decomposition — it survives unchanged.
    expect(stripDiacritics("Straße")).toBe("Straße");
    expect(stripDiacritics("été")).toBe("ete");
  });

  it("leaves CJK and Devanagari untouched", () => {
    expect(stripDiacritics("辞書")).toBe("辞書");
    expect(stripDiacritics("शब्द")).toBe("शब्द");
  });
});

describe("normalizeAnswer", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeAnswer("  hello   world  ", { accentInsensitive: false })).toBe(
      "hello world",
    );
  });

  it("lowercases", () => {
    expect(normalizeAnswer("Dictionary", { accentInsensitive: false })).toBe("dictionary");
  });

  it("normalizes to NFC", () => {
    // "é" as e + combining accent should match the precomposed form.
    const decomposed = "cafe\u0301";
    expect(normalizeAnswer(decomposed, { accentInsensitive: false })).toBe("café");
  });

  it("strips accents when accentInsensitive is true", () => {
    expect(normalizeAnswer("Café", { accentInsensitive: true })).toBe("cafe");
    expect(normalizeAnswer("Café", { accentInsensitive: false })).toBe("café");
  });

  it("does not break Devanagari matras", () => {
    expect(normalizeAnswer("नमस्ते", { accentInsensitive: true })).toBe("नमस्ते");
  });

  it("strict mode keeps accents", () => {
    expect(normalizeStrict("Café")).toBe("café");
  });
});

describe("isAnswerCorrect", () => {
  it("matches ignoring case and surrounding whitespace", () => {
    expect(isAnswerCorrect("  DICTIONARY ", "dictionary", { accentInsensitive: false })).toBe(
      true,
    );
  });

  it("respects accent strictness", () => {
    expect(isAnswerCorrect("cafe", "café", { accentInsensitive: true })).toBe(true);
    expect(isAnswerCorrect("cafe", "café", { accentInsensitive: false })).toBe(false);
  });

  it("never matches an empty answer", () => {
    expect(isAnswerCorrect("", "word", { accentInsensitive: true })).toBe(false);
    expect(isAnswerCorrect("   ", "word", { accentInsensitive: true })).toBe(false);
  });

  it("matches multi-word answers with collapsed whitespace", () => {
    expect(isAnswerCorrect("quid  pro quo", "quid pro quo", { accentInsensitive: true })).toBe(
      true,
    );
  });

  it("matches CJK answers exactly", () => {
    expect(isAnswerCorrect("安全", "安全", { accentInsensitive: true })).toBe(true);
    expect(isAnswerCorrect("安然", "安全", { accentInsensitive: true })).toBe(false);
  });
});
