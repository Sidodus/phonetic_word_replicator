/**
 * Session state machine — the pure core of a game round.
 *
 * The React layer renders this state and feeds events in; all rules (3
 * attempts, combos, XP, speed scoring, reveal handling) live here so they are
 * unit-testable without a DOM.
 *
 * Per mode:
 *  - classic/listen/daily: 3 attempts, hints allowed, reveal on final miss.
 *  - choice: 3 attempts via option selection, no hints.
 *  - speed: one attempt per word, timer-driven end (component supplies time),
 *    combo multiplier scoring, auto-advance on every answer.
 */

import type {
  AttemptRecord,
  GameMode,
  LanguageCode,
  Question,
  SessionSummary,
} from "@/types/game";
import { MAX_ATTEMPTS } from "@/types/game";
import { normalizeAnswer, type NormalizeOptions } from "./normalize";
import { xpForCorrect, SPEED_POINTS_PER_CORRECT, speedMultiplier, outcomeForAttempt } from "./scoring";
import { HINT_PENALTY_XP, HINT_PENALTY_STEP } from "./hint";

export interface SessionState {
  mode: GameMode;
  language: LanguageCode;
  questions: Question[];
  /** Index into `questions` of the question being played. */
  current: number;
  attemptNumber: number;
  /** Hints used on the current question. */
  hintsUsed: number;
  /** Set while the correct answer is being shown (after a final miss). */
  revealedAnswer: string | null;
  records: AttemptRecord[];
  /** Consecutive first-try correct answers (classic-style modes). */
  comboStreak: number;
  bestCombo: number;
  /** Consecutive correct answers in the speed round. */
  speedStreak: number;
  speedScore: number;
  status: "active" | "ended";
  startedAt: number;
  endedAt: number | null;
  /** XP accrued this session (already in records; mirrored for the HUD). */
  xpEarned: number;
  hintsTotal: number;
  /** Number of questions that had hints used (for the summary display). */
  questionsWithHints: number;
}

export type SessionEvent =
  | { type: "answer"; input: string; options: NormalizeOptions; now: number }
  | { type: "skip"; now: number }
  | { type: "hint" }
  | { type: "continue" } // advance after a reveal
  | { type: "timeout"; now: number }; // speed mode timer expiry

export interface AnswerResult {
  correct: boolean;
  /** XP granted by this answer (0 when wrong). */
  xpEarned: number;
  /** New speed-mode total (equals previous score when wrong). */
  speedScore: number;
  /** True when the miss ended the question and the answer is now revealed. */
  revealed: boolean;
}

export class SessionError extends Error {}

export function startSession(
  mode: GameMode,
  language: LanguageCode,
  questions: Question[],
  now: number,
): SessionState {
  if (questions.length === 0) {
    throw new SessionError("Cannot start a session with zero questions");
  }
  return {
    mode,
    language,
    questions,
    current: 0,
    attemptNumber: 1,
    hintsUsed: 0,
    revealedAnswer: null,
    records: [],
    comboStreak: 0,
    bestCombo: 0,
    speedStreak: 0,
    speedScore: 0,
    status: "active",
    startedAt: now,
    endedAt: null,
    xpEarned: 0,
    hintsTotal: 0,
    questionsWithHints: 0,
  };
}

/** The question currently being played. */
export function currentQuestion(state: SessionState): Question {
  const question = state.questions[state.current];
  if (!question) {
    throw new SessionError(`No question at index ${state.current}`);
  }
  return question;
}

/** Pronunciation shown to the player under the chosen standard. */
export function pronunciationFor(question: Question, standard: "IPA" | "X-SAMPA"): string {
  return standard === "IPA" ? question.ipa : question.xsampa;
}

function makeRecord(
  state: SessionState,
  question: Question,
  outcome: AttemptRecord["outcome"],
  attemptsUsed: number,
  xp: number,
  now: number,
): AttemptRecord {
  return {
    word: question.word,
    ipa: question.ipa,
    xsampa: question.xsampa,
    tier: question.tier,
    mode: state.mode,
    outcome,
    attemptsUsed,
    hintsUsed: state.hintsUsed,
    xpEarned: xp,
    answeredAt: now,
  };
}

function advance(state: SessionState, now: number): SessionState {
  const isLast = state.current + 1 >= state.questions.length;
  if (isLast) {
    return { ...state, status: "ended", endedAt: now, revealedAnswer: null };
  }
  return {
    ...state,
    current: state.current + 1,
    attemptNumber: 1,
    hintsUsed: 0,
    revealedAnswer: null,
  };
}

function recordCorrect(state: SessionState, attempts: number, now: number): {
  state: SessionState;
  result: AnswerResult;
} {
  const question = currentQuestion(state);
  let xp = 0;
  let speedScore = state.speedScore;
  let next: SessionState = state;

  if (state.mode === "speed") {
    const streak = state.speedStreak + 1;
    // The answer that completes a 3-streak already earns x2 (see GAME_DESIGN).
    const gained = SPEED_POINTS_PER_CORRECT * speedMultiplier(streak);
    speedScore = state.speedScore + gained;
    // Speed mode counts every correct as "first attempt" for colour coding.
    const record = makeRecord(state, question, "correct-first", 1, 0, now);
    next = {
      ...state,
      speedStreak: streak,
      speedScore,
      records: [...state.records, record],
    };
    next = advance(next, now);
    if (next.bestCombo < streak) next.bestCombo = streak;
  } else {
    const attemptNumber = attempts as 1 | 2 | 3;
    const comboStreak = attemptNumber === 1 ? state.comboStreak + 1 : 0;
    // Hint cost is charged inline (5 XP per hinted question — every 3 hinted
    // questions cost 15 XP, i.e. one miss equivalent; see GAME_DESIGN.md).
    const hintCost = state.hintsUsed > 0 ? HINT_PENALTY_XP / HINT_PENALTY_STEP : 0;
    xp = Math.max(0, xpForCorrect(attemptNumber, Math.max(comboStreak, 1)) - hintCost);
    const outcome = outcomeForAttempt(attemptNumber, true);
    const record = makeRecord(state, question, outcome, attemptNumber, xp, now);
    next = {
      ...state,
      comboStreak,
      bestCombo: Math.max(state.bestCombo, comboStreak),
      xpEarned: state.xpEarned + xp,
      records: [...state.records, record],
    };
    next = advance(next, now);
  }

  return {
    state: next,
    result: { correct: true, xpEarned: xp, speedScore, revealed: false },
  };
}

function recordMiss(state: SessionState, now: number): {
  state: SessionState;
  result: AnswerResult;
} {
  const question = currentQuestion(state);
  const attemptsUsed = state.attemptNumber;

  if (state.mode === "speed") {
    // One-shot mode: a miss moves on immediately, streak resets.
    const record = makeRecord(state, question, "failed", attemptsUsed, 0, now);
    const next = advance(
      { ...state, speedStreak: 0, records: [...state.records, record] },
      now,
    );
    return {
      state: next,
      result: { correct: false, xpEarned: 0, speedScore: state.speedScore, revealed: false },
    };
  }

  if (attemptsUsed < MAX_ATTEMPTS) {
    // More attempts remain — no record yet, no reveal.
    return {
      state: { ...state, attemptNumber: attemptsUsed + 1 },
      result: { correct: false, xpEarned: 0, speedScore: state.speedScore, revealed: false },
    };
  }

  // Final miss: reveal the answer, record the failure. The combo of
  // first-try answers is broken by this question ending without one.
  const record = makeRecord(state, question, "failed", attemptsUsed, 0, now);
  const next: SessionState = {
    ...state,
    comboStreak: 0,
    records: [...state.records, record],
    revealedAnswer: question.word,
  };
  return {
    state: next,
    result: { correct: false, xpEarned: 0, speedScore: state.speedScore, revealed: true },
  };
}

/** True when the current mode allows hint usage. */
export function hintsAllowed(state: SessionState): boolean {
  return state.mode === "classic" || state.mode === "listen" || state.mode === "daily";
}

export function reduceSession(state: SessionState, event: SessionEvent): {
  state: SessionState;
  result?: AnswerResult;
} {
  if (state.status !== "active") {
    throw new SessionError("Session has ended");
  }

  switch (event.type) {
    case "answer": {
      const question = currentQuestion(state);
      const target = normalizeAnswer(question.word, event.options);
      const answer = normalizeAnswer(event.input, event.options);
      if (answer.length === 0) {
        // Empty answers are rejected by the UI before dispatch; treat as no-op.
        return { state };
      }
      if (answer === target) {
        return recordCorrect(state, state.attemptNumber, event.now);
      }
      return recordMiss(state, event.now);
    }

    case "hint": {
      if (!hintsAllowed(state)) {
        throw new SessionError(`Hints are not allowed in "${state.mode}" mode`);
      }
      if (state.hintsUsed > 0) {
        // One hint per question (v2 policy — see GAME_DESIGN.md).
        return { state };
      }
      return {
        state: {
          ...state,
          hintsUsed: 1,
          hintsTotal: state.hintsTotal + 1,
          questionsWithHints: state.questionsWithHints + 1,
        },
      };
    }

    case "skip": {
      const question = currentQuestion(state);
      const record = makeRecord(state, question, "skipped", 0, 0, event.now);
      const next = advance(
        {
          ...state,
          speedStreak: 0,
          comboStreak: 0,
          records: [...state.records, record],
        },
        event.now,
      );
      return {
        state: next,
        result: { correct: false, xpEarned: 0, speedScore: state.speedScore, revealed: false },
      };
    }

    case "continue": {
      // Advance after a reveal (the UI shows the answer for 5 seconds first).
      if (state.revealedAnswer === null) {
        return { state };
      }
      return { state: advance(state, Date.now()) };
    }

    case "timeout": {
      if (state.mode !== "speed") {
        throw new SessionError("Timeout only applies to speed mode");
      }
      return {
        state: { ...state, status: "ended", endedAt: event.now, revealedAnswer: null },
      };
    }
  }
}

/** Build the end-of-session summary for persistence and display. */
export function summarize(state: SessionState): SessionSummary {
  if (state.status !== "ended") {
    throw new SessionError("Cannot summarize an active session");
  }
  const questionsInSession = state.records.length;
  const correctFirstInSession = state.records.filter((r) => r.outcome === "correct-first").length;
  return {
    mode: state.mode,
    language: state.language,
    records: state.records,
    xpEarned: state.xpEarned,
    hintsUsed: state.hintsTotal,
    bestCombo: state.bestCombo,
    speedScore: state.mode === "speed" ? state.speedScore : 0,
    startedAt: state.startedAt,
    endedAt: state.endedAt ?? Date.now(),
    questionsInSession,
    correctFirstInSession,
  };
}
