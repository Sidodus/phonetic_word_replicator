import { describe, expect, it } from "vitest";
import type { DictionaryPack, PackEntry } from "@/types/game";
import {
  buildChoiceOptions,
  dailySeedFor,
  pickChoiceQuestions,
  pickQuestions,
  pickReviewQuestions,
  QuestionGenerationError,
} from "@/lib/game/question-generator";
import { createRng } from "@/lib/game/rng";

function makeEntry(w: string, tier: PackEntry["tier"] = "core", ipa?: string): PackEntry {
  return { w, ipa: ipa ?? `/test-${w}/`, xs: `test${w}`, tier };
}

function makePack(entries: PackEntry[]): DictionaryPack {
  return {
    meta: {
      lang: "en",
      version: 2,
      generatedAt: "2026-11-10",
      source: "test",
      count: entries.length,
      tiers: {
        starter: entries.filter((e) => e.tier === "starter").length,
        core: entries.filter((e) => e.tier === "core").length,
        advanced: entries.filter((e) => e.tier === "advanced").length,
      },
    },
    entries,
  };
}

describe("dailySeedFor", () => {
  it("is deterministic per day+language", () => {
    expect(dailySeedFor("2026-11-10", "en")).toBe(dailySeedFor("2026-11-10", "en"));
    expect(dailySeedFor("2026-11-10", "en")).not.toBe(dailySeedFor("2026-11-10", "fr"));
    expect(dailySeedFor("2026-11-10", "en")).not.toBe(dailySeedFor("2026-11-11", "en"));
  });
});

describe("pickQuestions", () => {
  const pack = makePack([
    makeEntry("apple", "starter"),
    makeEntry("bread", "starter"),
    makeEntry("cheese", "core"),
    makeEntry("butter", "core"),
    makeEntry("marmalade", "advanced"),
  ]);

  it("returns the requested count of unique questions", () => {
    const rng = createRng(11);
    const questions = pickQuestions(pack, { count: 4, rng });
    expect(questions).toHaveLength(4);
    const words = new Set(questions.map((q) => q.word.toLowerCase()));
    expect(words.size).toBe(4);
  });

  it("is deterministic for the same seed (daily challenge)", () => {
    const a = pickQuestions(pack, { count: 3, rng: createRng("daily-seed") });
    const b = pickQuestions(pack, { count: 3, rng: createRng("daily-seed") });
    expect(a.map((q) => q.word)).toEqual(b.map((q) => q.word));
  });

  it("respects the tier filter", () => {
    const questions = pickQuestions(pack, { count: 1, rng: createRng(5), tier: "advanced" });
    expect(questions.every((q) => q.tier === "advanced")).toBe(true);
    const core = pickQuestions(pack, { count: 2, rng: createRng(5), tier: "core" });
    expect(core.every((q) => q.tier === "core")).toBe(true);
  });

  it("tops up from the whole pack when the tier pool is too small", () => {
    // Only 1 "advanced" entry exists; requesting 2 falls back to all entries.
    const questions = pickQuestions(pack, { count: 2, rng: createRng(5), tier: "advanced" });
    expect(questions).toHaveLength(2);
  });

  it("excludes provided words", () => {
    const questions = pickQuestions(pack, {
      count: 3,
      rng: createRng(5),
      exclude: new Set(["apple"]),
    });
    expect(questions.map((q) => q.word)).not.toContain("apple");
  });

  it("throws when the pool is too small", () => {
    expect(() => pickQuestions(pack, { count: 99, rng: createRng(1) })).toThrow(
      QuestionGenerationError,
    );
  });

  it("throws on zero-question packs", () => {
    expect(() => pickQuestions(makePack([]), { count: 1, rng: createRng(1) })).toThrow(
      QuestionGenerationError,
    );
  });

  it("rejects negative counts", () => {
    expect(() => pickQuestions(pack, { count: -1, rng: createRng(1) })).toThrow(RangeError);
  });
});

describe("buildChoiceOptions", () => {
  const pack = makePack([
    makeEntry("cat", "starter", "kæt"),
    makeEntry("bat", "starter", "bæt"),
    makeEntry("hat", "starter", "hæt"),
    makeEntry("cup", "starter", "kʌp"),
    makeEntry("dog", "starter", "dɒɡ"),
    makeEntry("cot", "starter", "kɒt"),
  ]);

  it("returns 4 unique options including the answer", () => {
    const answer = pack.entries[0];
    for (let seed = 0; seed < 50; seed++) {
      const options = buildChoiceOptions(answer, pack, createRng(seed));
      expect(options).toHaveLength(4);
      expect(options).toContain(answer.w);
      expect(new Set(options.map((o) => o.toLowerCase())).size).toBe(4);
    }
  });

  it("never mutates case-insensitive duplicates of the answer", () => {
    const answer = makeEntry("Cat", "starter", "kæt");
    const dupPack = makePack([
      answer,
      makeEntry("cat", "starter", "kæt"), // case duplicate must be skipped
      makeEntry("bat", "starter", "bæt"),
      makeEntry("hat", "starter", "hæt"),
      makeEntry("cup", "starter", "kʌp"),
    ]);
    const options = buildChoiceOptions(answer, dupPack, createRng(3));
    expect(options.filter((o) => o.toLowerCase() === "cat")).toHaveLength(1);
  });

  it("throws when the pack cannot supply enough distractors", () => {
    const small = makePack([makeEntry("cat"), makeEntry("bat")]);
    expect(() => buildChoiceOptions(small.entries[0], small, createRng(1))).toThrow(
      QuestionGenerationError,
    );
  });
});

describe("pickChoiceQuestions", () => {
  it("attaches options to every question", () => {
    const pack = makePack([
      makeEntry("apple", "starter"),
      makeEntry("bread", "starter"),
      makeEntry("cheese", "starter"),
      makeEntry("butter", "core"),
      makeEntry("marmalade", "advanced"),
    ]);
    const questions = pickChoiceQuestions(pack, { count: 3, rng: createRng(21) });
    expect(questions).toHaveLength(3);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.word);
    }
  });
});

describe("pickReviewQuestions", () => {
  const pack = makePack([
    makeEntry("apple", "starter"),
    makeEntry("bread", "starter"),
    makeEntry("cheese", "core"),
    makeEntry("marmalade", "advanced"),
  ]);

  it("builds questions only from the due words", () => {
    const due = [{ word: "apple" }, { word: "marmalade" }];
    const questions = pickReviewQuestions(pack, due, createRng(3), 5);
    expect(questions.map((q) => q.word).sort()).toEqual(["apple", "marmalade"]);
  });

  it("matches case-insensitively", () => {
    const questions = pickReviewQuestions(pack, [{ word: "Apple" }], createRng(3), 5);
    expect(questions).toHaveLength(1);
    expect(questions[0].word).toBe("apple");
  });

  it("skips words missing from the pack instead of failing", () => {
    const due = [{ word: "apple" }, { word: "deleted-word" }];
    const questions = pickReviewQuestions(pack, due, createRng(3), 5);
    expect(questions.map((q) => q.word)).toEqual(["apple"]);
  });

  it("returns nothing for an empty due list", () => {
    expect(pickReviewQuestions(pack, [], createRng(3), 5)).toEqual([]);
  });

  it("rejects negative counts", () => {
    expect(() => pickReviewQuestions(pack, [{ word: "apple" }], createRng(3), -1)).toThrow(
      RangeError,
    );
  });
});
