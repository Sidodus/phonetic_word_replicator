import { describe, expect, it } from "vitest";
import type { Question } from "@/types/game";
import {
  currentQuestion,
  hintsAllowed,
  pronunciationFor,
  reduceSession,
  SessionError,
  startSession,
  summarize,
} from "@/lib/game/session";

const Q: Question[] = [
  { word: "cat", ipa: "kæt", xsampa: "k{t", tier: "starter" },
  { word: "dog", ipa: "dɒɡ", xsampa: "dQg", tier: "starter" },
  { word: "bird", ipa: "bɜːd", xsampa: "b3:d", tier: "starter" },
];

const NOW = 1700000000000;
const LENIENT = { accentInsensitive: true };

function classic(): ReturnType<typeof startSession> {
  return startSession("classic", "en", Q, NOW);
}

describe("startSession", () => {
  it("rejects empty question lists", () => {
    expect(() => startSession("classic", "en", [], NOW)).toThrow(SessionError);
  });

  it("initialises to the first question with 1 attempt", () => {
    const s = classic();
    expect(s.current).toBe(0);
    expect(s.attemptNumber).toBe(1);
    expect(s.status).toBe("active");
    expect(currentQuestion(s).word).toBe("cat");
  });
});

describe("pronunciationFor", () => {
  it("selects the standard", () => {
    expect(pronunciationFor(Q[0], "IPA")).toBe("kæt");
    expect(pronunciationFor(Q[0], "X-SAMPA")).toBe("k{t");
  });
});

describe("classic mode", () => {
  it("correct on the first attempt records correct-first and advances", () => {
    let s = classic();
    const { state, result } = reduceSession(s, {
      type: "answer",
      input: "  CAT ",
      options: LENIENT,
      now: NOW,
    });
    expect(result?.correct).toBe(true);
    expect(result?.xpEarned).toBe(22); // 10 base + 10 first-try + 2 combo(1)
    expect(state.records[0]).toMatchObject({ word: "cat", outcome: "correct-first", attemptsUsed: 1 });
    expect(state.current).toBe(1);
    expect(state.comboStreak).toBe(1);
    s = state;
  });

  it("counts misses across three attempts, then reveals the answer", () => {
    let s = classic();
    // Miss 1: no record, attempt 2
    const r1 = reduceSession(s, { type: "answer", input: "dog", options: LENIENT, now: NOW });
    expect(r1.result?.revealed).toBe(false);
    expect(r1.state.attemptNumber).toBe(2);
    expect(r1.state.records).toHaveLength(0);
    s = r1.state;
    // Miss 2: attempt 3
    const r2 = reduceSession(s, { type: "answer", input: "cow", options: LENIENT, now: NOW });
    expect(r2.state.attemptNumber).toBe(3);
    s = r2.state;
    // Miss 3: record failed, reveal, stay on the same question
    const r3 = reduceSession(s, { type: "answer", input: "bat", options: LENIENT, now: NOW });
    expect(r3.result?.revealed).toBe(true);
    expect(r3.state.revealedAnswer).toBe("cat");
    expect(r3.state.records[0]).toMatchObject({ outcome: "failed", attemptsUsed: 3, xpEarned: 0 });
    expect(r3.state.current).toBe(0);
    s = r3.state;
    // Continue advances to the next question and resets attempts
    const r4 = reduceSession(s, { type: "continue" });
    expect(r4.state.current).toBe(1);
    expect(r4.state.attemptNumber).toBe(1);
    expect(r4.state.revealedAnswer).toBeNull();
  });

  it("correct on the third attempt records correct-third", () => {
    let s = classic();
    s = reduceSession(s, { type: "answer", input: "x", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "y", options: LENIENT, now: NOW }).state;
    const { state, result } = reduceSession(s, {
      type: "answer",
      input: "cat",
      options: LENIENT,
      now: NOW,
    });
    expect(result?.correct).toBe(true);
    expect(state.records[0].outcome).toBe("correct-third");
    expect(state.comboStreak).toBe(0); // combo counts first-try only
  });

  it("builds combos on consecutive first-try answers and grants capped bonus XP", () => {
    let s = classic();
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "dog", options: LENIENT, now: NOW }).state;
    const r3 = reduceSession(s, { type: "answer", input: "bird", options: LENIENT, now: NOW });
    expect(r3.state.comboStreak).toBe(3);
    expect(r3.state.bestCombo).toBe(3);
    // combo 3 → bonus 6: 10 + 10 + 6
    expect(r3.result?.xpEarned).toBe(26);
  });

  it("a miss after a combo resets the streak once the question ends", () => {
    let s = classic();
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "dog", options: LENIENT, now: NOW }).state;
    // Mid-question the displayed streak is retained (still "at risk").
    s = reduceSession(s, { type: "answer", input: "nope", options: LENIENT, now: NOW }).state;
    expect(s.comboStreak).toBe(2);
    // A second-attempt correct resets the streak (not a first-try).
    s = reduceSession(s, { type: "answer", input: "bird", options: LENIENT, now: NOW }).state;
    expect(s.comboStreak).toBe(0);
    expect(s.records[2].outcome).toBe("correct-second");
  });

  it("a final miss breaks the combo for subsequent questions", () => {
    const manyQs: Question[] = [
      ...Q,
      { word: "tree", ipa: "tɹiː", xsampa: "tr\\i:", tier: "starter" },
    ];
    let s = startSession("classic", "en", manyQs, NOW);
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "dog", options: LENIENT, now: NOW }).state;
    expect(s.comboStreak).toBe(2);
    // Fail "bird" through all attempts.
    s = reduceSession(s, { type: "answer", input: "x", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "y", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "z", options: LENIENT, now: NOW }).state;
    expect(s.comboStreak).toBe(0);
    s = reduceSession(s, { type: "continue" }).state;
    // Next question answered first-try starts a fresh combo, not 3.
    const r = reduceSession(s, { type: "answer", input: "tree", options: LENIENT, now: NOW });
    expect(r.state.comboStreak).toBe(1);
    expect(r.result?.xpEarned).toBe(22); // combo 1, not 3
  });

  it("ends the session after the final question", () => {
    let s = classic();
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "dog", options: LENIENT, now: NOW }).state;
    const last = reduceSession(s, { type: "answer", input: "bird", options: LENIENT, now: NOW });
    expect(last.state.status).toBe("ended");
    expect(last.state.endedAt).not.toBeNull();
  });

  it("ignores empty answers", () => {
    const s = classic();
    const { state, result } = reduceSession(s, {
      type: "answer",
      input: "   ",
      options: LENIENT,
      now: NOW,
    });
    expect(result).toBeUndefined();
    expect(state.attemptNumber).toBe(1);
  });

  it("respects accent strictness", () => {
    const pack: Question[] = [{ word: "café", ipa: "kafe", xsampa: "kafe", tier: "core" }];
    let s = startSession("classic", "fr", pack, NOW);
    s = reduceSession(s, {
      type: "answer",
      input: "cafe",
      options: { accentInsensitive: false },
      now: NOW,
    }).state;
    expect(s.attemptNumber).toBe(2);
    const { result } = reduceSession(s, {
      type: "answer",
      input: "cafe",
      options: { accentInsensitive: true },
      now: NOW,
    });
    expect(result?.correct).toBe(true);
  });
});

describe("hints", () => {
  it("are allowed in classic/listen/daily but not choice/speed", () => {
    expect(hintsAllowed(startSession("classic", "en", Q, NOW))).toBe(true);
    expect(hintsAllowed(startSession("listen", "en", Q, NOW))).toBe(true);
    expect(hintsAllowed(startSession("daily", "en", Q, NOW))).toBe(true);
    expect(hintsAllowed(startSession("choice", "en", Q, NOW))).toBe(false);
    expect(hintsAllowed(startSession("speed", "en", Q, NOW))).toBe(false);
  });

  it("charge 5 XP inline on a hinted question (3 hints = 15 XP)", () => {
    let s = classic();
    s = reduceSession(s, { type: "hint" }).state;
    expect(s.hintsUsed).toBe(1);
    const { state, result } = reduceSession(s, {
      type: "answer",
      input: "cat",
      options: LENIENT,
      now: NOW,
    });
    // 22 XP for a first-try answer minus the 5 XP hint cost.
    expect(result?.xpEarned).toBe(17);
    expect(state.records[0]).toMatchObject({ hintsUsed: 1, xpEarned: 17 });
  });

  it("apply only once per question", () => {
    let s = classic();
    s = reduceSession(s, { type: "hint" }).state;
    const again = reduceSession(s, { type: "hint" });
    expect(again.state.hintsUsed).toBe(1);
    expect(again.state.hintsTotal).toBe(1);
  });

  it("throw when used in a mode that disallows them", () => {
    const s = startSession("choice", "en", Q, NOW);
    expect(() => reduceSession(s, { type: "hint" })).toThrow(SessionError);
  });
});

describe("skip", () => {
  it("records a skipped outcome and resets combos", () => {
    let s = classic();
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    const { state } = reduceSession(s, { type: "skip", now: NOW });
    expect(state.records[1]).toMatchObject({ word: "dog", outcome: "skipped", attemptsUsed: 0 });
    expect(state.comboStreak).toBe(0);
    expect(state.current).toBe(2);
  });
});

describe("speed mode", () => {
  const SPEED_QS: Question[] = [
    ...Q,
    { word: "tree", ipa: "tɹiː", xsampa: "tr\\i:", tier: "starter" },
    { word: "house", ipa: "haʊs", xsampa: "haUs", tier: "starter" },
    { word: "water", ipa: "wɔːtə", xsampa: "wO:t@", tier: "starter" },
  ];

  function speed(): ReturnType<typeof startSession> {
    return startSession("speed", "en", SPEED_QS, NOW);
  }

  it("scores with the streak multiplier and advances on every answer", () => {
    let s = speed();
    // streak 1 → x1 → 10
    let r = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW });
    expect(r.result?.speedScore).toBe(10);
    s = r.state;
    // streak 2 → x1 → 20
    r = reduceSession(s, { type: "answer", input: "dog", options: LENIENT, now: NOW });
    expect(r.result?.speedScore).toBe(20);
    s = r.state;
    // streak 3 → x2 → 20 + 20
    r = reduceSession(s, { type: "answer", input: "bird", options: LENIENT, now: NOW });
    expect(r.result?.speedScore).toBe(40);
    expect(r.state.bestCombo).toBe(3);
    expect(r.state.status).toBe("active");
  });

  it("resets the streak on a miss but keeps the score", () => {
    let s = speed();
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "dog", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "bird", options: LENIENT, now: NOW }).state; // x2 → 40
    const r = reduceSession(s, { type: "answer", input: "zzz", options: LENIENT, now: NOW });
    expect(r.state.speedStreak).toBe(0);
    expect(r.result?.speedScore).toBe(40);
    expect(r.state.records[3].outcome).toBe("failed");
    // After the reset the next correct earns x1 again (current question: house).
    const next = reduceSession(r.state, { type: "answer", input: "house", options: LENIENT, now: NOW });
    expect(next.result?.speedScore).toBe(50);
  });

  it("ends on timeout", () => {
    const s = speed();
    const r = reduceSession(s, { type: "timeout", now: NOW });
    expect(r.state.status).toBe("ended");
  });

  it("rejects timeout in non-speed modes", () => {
    expect(() => reduceSession(classic(), { type: "timeout", now: NOW })).toThrow(SessionError);
  });
});

describe("summarize", () => {
  it("throws while the session is active", () => {
    expect(() => summarize(classic())).toThrow(SessionError);
  });

  it("summarizes a finished session", () => {
    let s = classic();
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "hint" }).state;
    s = reduceSession(s, { type: "skip", now: NOW }).state;
    const r = reduceSession(s, { type: "answer", input: "bird", options: LENIENT, now: NOW });
    s = r.state;
    const summary = summarize(s);
    expect(summary.mode).toBe("classic");
    expect(summary.language).toBe("en");
    expect(summary.records).toHaveLength(3);
    expect(summary.speedScore).toBe(0);
    expect(summary.questionsInSession).toBe(3);
    expect(summary.correctFirstInSession).toBe(2); // cat + bird, both first-try
    expect(summary.hintsUsed).toBe(1);
    expect(summary.endedAt).not.toBeNull();
  });

  it("reports the speed score only for speed sessions", () => {
    let s = startSession("speed", "en", Q, NOW);
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "timeout", now: NOW }).state;
    expect(summarize(s).speedScore).toBe(10);
  });
});

describe("invariants", () => {
  it("throws all events after the session ended", () => {
    let s = classic();
    s = reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "dog", options: LENIENT, now: NOW }).state;
    s = reduceSession(s, { type: "answer", input: "bird", options: LENIENT, now: NOW }).state;
    expect(s.status).toBe("ended");
    expect(() =>
      reduceSession(s, { type: "answer", input: "cat", options: LENIENT, now: NOW }),
    ).toThrow(SessionError);
  });

  it("never produces NaN XP or negative values across a fuzz run", () => {
    let s = classic();
    let guard = 0;
    while (s.status === "active" && guard < 500) {
      guard += 1;
      const events = [
        { type: "answer", input: Math.random() > 0.5 ? "cat" : "zzz", options: LENIENT, now: NOW },
        { type: "skip", now: NOW },
        { type: "hint" },
        { type: "continue" },
      ] as const;
      const event = events[Math.floor(Math.random() * events.length)];
      try {
        s = reduceSession(s, event).state;
      } catch {
        // Disallowed events (hint in choice mode, etc.) are skipped in fuzz.
      }
      expect(Number.isNaN(s.xpEarned)).toBe(false);
      expect(s.xpEarned).toBeGreaterThanOrEqual(0);
      expect(s.comboStreak).toBeGreaterThanOrEqual(0);
      expect(s.attemptNumber).toBeGreaterThanOrEqual(1);
      expect(s.attemptNumber).toBeLessThanOrEqual(3);
    }
  });
});
