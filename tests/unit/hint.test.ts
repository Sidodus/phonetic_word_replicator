import { describe, expect, it } from "vitest";
import {
  buildHintMask,
  hintPenaltyXp,
  pickHintPattern,
  toGraphemes,
  HINT_MASK_CHAR,
  SHORT_WORD_MAX,
} from "@/lib/game/hint";
import { createRng } from "@/lib/game/rng";

describe("toGraphemes", () => {
  it("splits Latin words into letters", () => {
    expect(toGraphemes("dictionary")).toEqual([...("dictionary")]);
  });

  it("keeps Devanagari aksharas intact (never splits matras)", () => {
    const clusters = toGraphemes("नमस्ते");
    // न | म | स्ते — the virama+ta+e stay together with sa.
    expect(clusters.join("|")).toBe("न|म|स्ते");
  });

  it("handles surrogate pairs (emoji/CJK ext)", () => {
    expect(toGraphemes("𠮷野家")).toEqual(["𠮷", "野", "家"]);
  });
});

describe("buildHintMask", () => {
  it("reveals only the first grapheme for short words", () => {
    expect(buildHintMask("cat", "odd-positions")).toBe(`c${HINT_MASK_CHAR}${HINT_MASK_CHAR}`);
    expect(buildHintMask("word", "even-positions")).toBe(`w${HINT_MASK_CHAR}${HINT_MASK_CHAR}${HINT_MASK_CHAR}`);
  });

  it("even-positions pattern reveals indexes 0,2,4…", () => {
    // REGRESSION for v1's `[i] % 2` bug: the two patterns must differ and
    // reveal alternating positions deterministically.
    expect(buildHintMask("garden", "even-positions")).toBe(`g${HINT_MASK_CHAR}r${HINT_MASK_CHAR}e${HINT_MASK_CHAR}`);
  });

  it("odd-positions pattern reveals indexes 1,3,5…", () => {
    expect(buildHintMask("garden", "odd-positions")).toBe("_a_d_n");
  });

  it("never reveals the whole word", () => {
    const word = "dictionary";
    for (const pattern of ["odd-positions", "even-positions"] as const) {
      const mask = buildHintMask(word, pattern);
      expect(mask).toContain(HINT_MASK_CHAR);
      expect(mask).not.toBe(word);
    }
  });

  it("does not leak the target for CJK words", () => {
    const mask = buildHintMask("安全", "odd-positions"); // length 2 → short rule
    expect(mask).toBe(`安${HINT_MASK_CHAR}`);
  });

  it("returns empty string for empty input", () => {
    expect(buildHintMask("", "even-positions")).toBe("");
  });

  it("both patterns differ for long words", () => {
    expect(buildHintMask("phonetics", "odd-positions")).not.toBe(
      buildHintMask("phonetics", "even-positions"),
    );
  });

  it(`treats words up to ${SHORT_WORD_MAX} graphemes as short`, () => {
    expect(buildHintMask("able", "even-positions")).toBe(`a${HINT_MASK_CHAR.repeat(3)}`);
    // 5 graphemes → alternating mask, even positions reveal: a, l, s
    expect(buildHintMask("ables", "even-positions")).toBe(`a${HINT_MASK_CHAR}l${HINT_MASK_CHAR}s`);
  });
});

describe("pickHintPattern", () => {
  it("returns both patterns over many draws and is deterministic", () => {
    const a = createRng(9);
    const b = createRng(9);
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const pa = pickHintPattern(a);
      const pb = pickHintPattern(b);
      expect(pa).toBe(pb);
      seen.add(pa);
    }
    expect(seen.size).toBe(2);
  });
});

describe("hintPenaltyXp", () => {
  it("charges 15 XP per completed set of 3 hints", () => {
    expect(hintPenaltyXp(0)).toBe(0);
    expect(hintPenaltyXp(1)).toBe(0);
    expect(hintPenaltyXp(2)).toBe(0);
    expect(hintPenaltyXp(3)).toBe(15);
    expect(hintPenaltyXp(5)).toBe(15);
    expect(hintPenaltyXp(6)).toBe(30);
  });

  it("throws on invalid input", () => {
    expect(() => hintPenaltyXp(-1)).toThrow(RangeError);
    expect(() => hintPenaltyXp(1.5)).toThrow(RangeError);
  });
});
