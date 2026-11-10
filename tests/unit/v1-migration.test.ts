import { describe, expect, it } from "vitest";
import { importV1Storage } from "@/lib/storage/v1-migration";

/** Minimal localStorage stand-in. */
function makeStorage(entries: Record<string, string>) {
  return {
    getItem: (key: string) => (key in entries ? entries[key] : null),
  };
}

describe("importV1Storage", () => {
  it("maps English (unsuffixed) counters", () => {
    const result = importV1Storage(
      makeStorage({
        "Correct Word On 1st Attempt": "3",
        "Correct Word On 2nd Attempt": "2",
        "Correct Word On 3rd Attempt": "1",
        "Wrong Word": "4",
        "Hints Count": "2",
        "Deducted Hint Point": "3",
      }),
    );
    expect(result.languages.en).toEqual({
      correctFirst: 3,
      correctSecond: 2,
      correctThird: 1,
      wrong: 4,
      hintsUsed: 11, // 3 triples * 3 + running 2
    });
    expect(result.hasAnyData).toBe(true);
  });

  it("maps per-language suffixed counters (v1 used language codes)", () => {
    const result = importV1Storage(
      makeStorage({
        "Correct Word On 1st Attempt(hi)": "5",
        "Wrong Word(fr)": "7",
      }),
    );
    expect(result.languages.hi?.correctFirst).toBe(5);
    expect(result.languages.fr?.wrong).toBe(7);
    expect(result.languages.en).toBeUndefined();
  });

  it("reads every language code suffix", () => {
    const result = importV1Storage(
      makeStorage({
        "Wrong Word(zh)": "1",
        "Wrong Word(nl)": "1",
        "Wrong Word(de)": "1",
        "Wrong Word(it)": "1",
        "Wrong Word(es)": "1",
        "Wrong Word(fr)": "1",
        "Wrong Word(hi)": "1",
      }),
    );
    expect(Object.keys(result.languages).sort()).toEqual(["de", "es", "fr", "hi", "it", "nl", "zh"]);
  });

  it("imports history with outcome mapping from v1 Bootstrap classes", () => {
    const history = [
      { previousWord: "cat", previousIpa: "/kæt/", previousXSampa: "/k{t/", className: "bg-primary" },
      { previousWord: "dog", previousIpa: "/dɒɡ/", previousXSampa: "/dQg/", className: "bg-warning" },
      { previousWord: "bird", previousIpa: "/bɜːd/", previousXSampa: "/b3:d/", className: "bg-danger" },
      { previousWord: "fish", previousIpa: "/fɪʃ/", previousXSampa: "/fIS/", className: "bg-secondary" },
    ];
    const result = importV1Storage(
      makeStorage({ "All Attempted Questions": JSON.stringify(history) }),
    );
    expect(result.history).toHaveLength(4);
    expect(result.history[0]).toMatchObject({
      word: "cat",
      ipa: "kæt",
      xsampa: "k{t",
      outcome: "correct-first",
      attemptsUsed: 1,
      mode: "classic",
    });
    expect(result.history[1].outcome).toBe("correct-second");
    expect(result.history[1].attemptsUsed).toBe(2);
    expect(result.history[2].outcome).toBe("correct-third");
    expect(result.history[3]).toMatchObject({ outcome: "failed", attemptsUsed: 0 });
  });

  it("skips corrupt history entries without failing the import", () => {
    const history = [
      { previousWord: "cat", previousIpa: "/kæt/", previousXSampa: "/k{t/", className: "bg-primary" },
      { previousWord: "", previousIpa: "/x/", previousXSampa: "/x/", className: "bg-primary" },
      { previousWord: "dog", previousIpa: "/d/", previousXSampa: "/d/", className: "bg-pink" },
    ];
    const result = importV1Storage(
      makeStorage({ "All Attempted Questions": JSON.stringify(history) }),
    );
    expect(result.history).toHaveLength(1);
  });

  it("ignores completely corrupt history JSON", () => {
    const result = importV1Storage(
      makeStorage({ "All Attempted Questions": "{not json" }),
    );
    expect(result.history).toHaveLength(0);
  });

  it("reads the phonetic standard and last language", () => {
    const result = importV1Storage(
      makeStorage({ "Phonetics Sound": "X-SAMPA", "PWR Language": "German" }),
    );
    expect(result.standard).toBe("X-SAMPA");
    expect(result.lastLanguage).toBe("de");
  });

  it("reports no data for an empty store", () => {
    const result = importV1Storage(makeStorage({}));
    expect(result.hasAnyData).toBe(false);
    expect(result.languages).toEqual({});
    expect(result.history).toHaveLength(0);
  });

  it("treats garbage counter values as no data", () => {
    const result = importV1Storage(
      makeStorage({ "Correct Word On 1st Attempt": "banana", "Wrong Word": "-5" }),
    );
    // All-zero languages are not imported at all.
    expect(result.languages.en).toBeUndefined();
    expect(result.hasAnyData).toBe(false);
  });
});
