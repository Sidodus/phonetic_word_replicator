import { describe, expect, it } from "vitest";
import { createPinyinEquivalence } from "@/lib/game/pinyin";

describe("createPinyinEquivalence", () => {
  const eq = async () => await createPinyinEquivalence();

  it("accepts plain pinyin for a traditional character", async () => {
    const equivalence = await eq();
    expect(equivalence("ma", "馬")).toBe(true);
    expect(equivalence("ma", "马")).toBe(true);
  });

  it("accepts tone digits and tone marks from the player", async () => {
    const equivalence = await eq();
    expect(equivalence("ma3", "馬")).toBe(true);
    expect(equivalence("mǎ", "馬")).toBe(true);
    expect(equivalence("MA", "馬")).toBe(true);
  });

  it("rejects different syllables", async () => {
    const equivalence = await eq();
    expect(equivalence("mo", "馬")).toBe(false);
    expect(equivalence("mam", "馬")).toBe(false);
  });

  it("rejects empty/whitespace answers", async () => {
    const equivalence = await eq();
    expect(equivalence("", "馬")).toBe(false);
    expect(equivalence("   ", "馬")).toBe(false);
  });

  it("accepts exact latin answers for latin words (identity on both sides)", async () => {
    const equivalence = await eq();
    expect(equivalence("dictionary", "dictionary")).toBe(true);
    expect(equivalence("dictionary", "dictionnaire")).toBe(false);
  });

  it("handles multi-character words", async () => {
    const equivalence = await eq();
    expect(equivalence("anxin", "安心")).toBe(true);
    expect(equivalence("xinan", "安心")).toBe(false);
  });
});
