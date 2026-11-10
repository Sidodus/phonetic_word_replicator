"use client";

/**
 * The play screen: loads the pack, builds questions (seeded for the daily
 * challenge), drives the session state machine and renders mode-specific
 * controls. All game rules live in lib/game/session.ts — this component only
 * orchestrates rendering, sound, speech and timing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import type { AttemptRecord, GameMode, LanguageCode, Question } from "@/types/game";
import { GAME_LANGUAGES, GAME_MODES } from "@/types/game";
import { GAME_LANGUAGE_META, GAME_MODE_META } from "@/lib/game/modes";
import { createRng, dateKey } from "@/lib/game/rng";
import {
  dailySeedFor,
  pickQuestions,
  pickChoiceQuestions,
} from "@/lib/game/question-generator";
import {
  currentQuestion,
  hintsAllowed,
  pronunciationFor,
  reduceSession,
  startSession,
  summarize,
  type AnswerResult,
  type SessionState,
} from "@/lib/game/session";
import { buildHintMask, pickHintPattern } from "@/lib/game/hint";
import { loadPack } from "@/lib/game/dictionary";
import { useProfileStore } from "@/lib/storage/profile";
import { useI18n, pluralVars } from "@/lib/i18n/provider";
import type { UiLocale } from "@/lib/i18n";
import { speak, stopSpeaking } from "@/lib/speech/tts";
import { createSfxPlayer } from "@/lib/audio/sfx";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import SessionRail from "./SessionRail";
import EndSummaryModal from "./EndSummaryModal";
import SpeedTimer from "./SpeedTimer";

const REVEAL_SECONDS = 5;

interface PackState {
  status: "loading" | "ready" | "error";
}

function isGameMode(value: string | null): value is GameMode {
  return value !== null && (GAME_MODES as readonly string[]).includes(value);
}

function isGameLanguage(value: string | null): value is LanguageCode {
  return value !== null && (GAME_LANGUAGES as readonly string[]).includes(value);
}

export default function GamePage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = searchParams.get("mode");
  const langParam = searchParams.get("lang");
  const mode: GameMode = isGameMode(modeParam) ? modeParam : "classic";
  const language: LanguageCode = isGameLanguage(langParam) ? langParam : "en";

  const settings = useProfileStore((s) => s.settings);
  const recordAttemptAction = useProfileStore((s) => s.recordAttempt);
  const endSessionAction = useProfileStore((s) => s.endSession);
  const bestSpeedScore = useProfileStore((s) => s.bestSpeedScore[language] ?? 0);

  const [packStatus, setPackStatus] = useState<PackState["status"]>("loading");
  const [session, setSession] = useState<SessionState | null>(null);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [hintMask, setHintMask] = useState<string | null>(null);
  const [revealSeconds, setRevealSeconds] = useState(0);
  const [summary, setSummary] = useState<ReturnType<typeof summarize> | null>(null);
  const [unlockedNames, setUnlockedNames] = useState<string[]>([]);
  const [speedTimeLeft, setSpeedTimeLeft] = useState(
    GAME_MODE_META[mode].timeLimitSeconds || 0,
  );

  const sfx = useMemo(
    () => createSfxPlayer(() => useProfileStore.getState().settings.soundEnabled),
    [],
  );
  const endedRef = useRef(false);

  // ------------------------------------------------------------------
  // Pack loading + question building
  // ------------------------------------------------------------------
  const buildQuestions = useCallback(
    (questions: Question[]) => {
      setSession(startSession(mode, language, questions, Date.now()));
      endedRef.current = false;
      setSummary(null);
      setUnlockedNames([]);
      setInput("");
      setInputError(null);
      setHintMask(null);
      setSpeedTimeLeft(GAME_MODE_META[mode].timeLimitSeconds || 0);
    },
    [mode, language],
  );

  useEffect(() => {
    let cancelled = false;
    setPackStatus("loading");
    setSession(null);
    (async () => {
      try {
        const pack = await loadPack(language);
        const meta = GAME_MODE_META[mode];
        const rng =
          mode === "daily"
            ? createRng(dailySeedFor(dateKey(new Date()), language))
            : createRng(`${Date.now()}`, "session");
        const builder = meta.multipleChoice ? pickChoiceQuestions : pickQuestions;
        // Small packs serve what they have rather than hard-failing.
        const desired = mode === "speed" ? 60 : meta.sessionLength;
        const count = Math.min(desired, pack.entries.length);
        const questions = builder(pack, { count, rng });
        if (cancelled) return;
        setPackStatus("ready");
        buildQuestions(questions);
      } catch (err) {
        if (cancelled) return;
        void err;
        setPackStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, mode, buildQuestions]);

  // ------------------------------------------------------------------
  // Session event helper (closure-based; handlers re-render each turn)
  // ------------------------------------------------------------------
  const send = useCallback(
    (event: Parameters<typeof reduceSession>[1]): AnswerResult | undefined => {
      if (!session || session.status !== "active") return undefined;
      const { state: next, result } = reduceSession(session, event);
      // Persist every new attempt record to the profile (live XP + history).
      for (const record of next.records.slice(session.records.length)) {
        recordAttemptAction(language, record);
      }
      setSession(next);
      return result;
    },
    [session, language, recordAttemptAction],
  );

  // ------------------------------------------------------------------
  // Persist session once it ends
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!session || session.status !== "ended" || endedRef.current) return;
    endedRef.current = true;
    stopSpeaking();
    const s = summarize(session);
    const today = dateKey(new Date());
    const newAchievements = endSessionAction(s, today);
    setSummary(s);
    setUnlockedNames(
      newAchievements
        .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
        .filter((a): a is (typeof ACHIEVEMENTS)[number] => Boolean(a))
        .map((a) => t(`achievements.${a.i18nKey}.name`)),
    );
  }, [session, endSessionAction, t]);

  // ------------------------------------------------------------------
  // Speed-mode countdown
  // ------------------------------------------------------------------
  useEffect(() => {
    if (mode !== "speed" || packStatus !== "ready" || session?.status !== "active") {
      return;
    }
    const interval = setInterval(() => {
      setSpeedTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, packStatus, session?.status]);

  // Timeout/tick reactions live in their own effect (no state updates inside
  // updater functions).
  useEffect(() => {
    if (mode !== "speed" || packStatus !== "ready") return;
    if (speedTimeLeft === 0) {
      setSession((current) =>
        current && current.status === "active"
          ? reduceSession(current, { type: "timeout", now: Date.now() }).state
          : current,
      );
      sfx.play("timeup");
      return;
    }
    if (speedTimeLeft <= 5) {
      sfx.play("tick");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedTimeLeft, mode, packStatus]);

  // ------------------------------------------------------------------
  // Reveal countdown after a final miss
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!session?.revealedAnswer) return;
    setRevealSeconds(REVEAL_SECONDS);
    sfx.play("reveal");
    if (settings.autoPronounce) {
      speak(session.revealedAnswer, GAME_LANGUAGE_META[language].ttsLocale);
    }
    const interval = setInterval(() => {
      setRevealSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSession((current) =>
            current && current.status === "active"
              ? reduceSession(current, { type: "continue" }).state
              : current,
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.revealedAnswer]);

  const question: Question | null =
    session && session.status === "active" ? currentQuestion(session) : null;

  const submit = (value?: string) => {
    if (!session || session.status !== "active") return;
    const answer = value ?? input;
    if (!session.revealedAnswer && answer.trim().length === 0) {
      setInputError(t("play.emptyInput"));
      return;
    }
    setInputError(null);
    const result = send({
      type: "answer",
      input: answer,
      options: { accentInsensitive: settings.accentInsensitive },
      now: Date.now(),
    });
    if (result?.correct) {
      sfx.play(session.comboStreak >= 2 ? "correct-streak" : "correct");
      if (settings.autoPronounce) {
        speak(currentQuestion(session).word, GAME_LANGUAGE_META[language].ttsLocale);
      }
    } else if (result) {
      sfx.play("wrong");
    }
    setInput("");
    setHintMask(null);
  };

  const useHint = () => {
    if (!session || session.status !== "active" || !question) return;
    if (hintMask !== null || session.hintsUsed > 0) return;
    send({ type: "hint" });
    setHintMask(buildHintMask(question.word, pickHintPattern(createRng(question.word, "hint"))));
  };

  const skip = () => {
    send({ type: "skip", now: Date.now() });
    setInput("");
    setHintMask(null);
  };

  if (packStatus === "loading") {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status" aria-hidden="true" />
        <p className="text-secondary mt-3">{t("common.loading")}</p>
      </div>
    );
  }

  if (packStatus === "error") {
    return (
      <Alert variant="danger" className="text-center">
        <p>{t("play.loadError")}</p>
        <Button variant="outline-light" onClick={() => window.location.reload()}>
          {t("play.retry")}
        </Button>
      </Alert>
    );
  }

  const isSpeed = mode === "speed";
  const modeMeta = GAME_MODE_META[mode];
  const langMeta = GAME_LANGUAGE_META[language];
  const standard = settings.standard;

  return (
    <Row className="g-3">
      <Col lg={8}>
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>
              {modeMeta.icon} <strong>{t(`modes.${modeMeta.i18nKey}.name`)}</strong>
              <span className="text-secondary"> · {langMeta.endonym}</span>
            </span>
            <span className="d-flex gap-2 align-items-center">
              {session && (
                <Badge bg="secondary">
                  {t("play.sessionOf", {
                    current: Math.min(session.current + 1, session.questions.length),
                    total: session.questions.length,
                  })}
                </Badge>
              )}
              {!isSpeed && session && (
                <Badge bg="warning" text="dark">
                  XP {session.xpEarned}
                </Badge>
              )}
              {isSpeed && session && (
                <Badge bg="warning" text="dark">
                  {t("play.score")}: {session.speedScore}
                </Badge>
              )}
            </span>
          </Card.Header>

          <Card.Body className="text-center py-4">
            {question && session && (
              <>
                {modeMeta.audioDriven ? (
                  <ListenPrompt
                    word={question.word}
                    ttsLocale={langMeta.ttsLocale}
                    prompt={t("play.listenPrompt")}
                    replayLabel={t("play.replayAudio")}
                    unavailableLabel={t("play.speechUnavailable")}
                  />
                ) : (
                  <div className="phonetic-display mb-2" data-testid="phonetic-display">
                    {pronunciationFor(question, standard)}
                  </div>
                )}

                {hintMask && (
                  <div className="hint-mask mb-2" data-testid="hint-mask">
                    {hintMask}
                  </div>
                )}

                {session.revealedAnswer ? (
                  <div className="my-3" data-testid="reveal">
                    <p className="text-secondary mb-1">{t("play.failed")}</p>
                    <div className="answer-reveal">{session.revealedAnswer}</div>
                    <p className="text-secondary small mt-2">
                      {t("play.timeLeft", { seconds: revealSeconds })}
                    </p>
                  </div>
                ) : (
                  <AttemptIndicator
                    attemptNumber={session.attemptNumber}
                    mode={mode}
                    comboStreak={session.mode === "speed" ? session.speedStreak : session.comboStreak}
                    locale={locale}
                  />
                )}
              </>
            )}
          </Card.Body>

          <Card.Footer>
            {session?.status === "active" && question && (
              <PlayControls
                mode={mode}
                input={input}
                onInput={(v) => {
                  setInput(v);
                  setInputError(null);
                }}
                inputError={inputError}
                onSubmit={submit}
                onHint={useHint}
                hintDisabled={hintMask !== null || !hintsAllowed(session)}
                onSkip={skip}
                options={question.options}
                onChoose={(option) => submit(option)}
                revealed={Boolean(session.revealedAnswer)}
              />
            )}
          </Card.Footer>
        </Card>

        {isSpeed && (
          <SpeedTimer
            secondsLeft={speedTimeLeft}
            total={GAME_MODE_META.speed.timeLimitSeconds}
            bestLabel={t("play.personalBest", {
              score: Math.max(bestSpeedScore, session?.speedScore ?? 0),
            })}
          />
        )}
      </Col>

      <Col lg={4}>
        <SessionRail
          title={t("play.attemptedWords")}
          records={(session?.records ?? []) as AttemptRecord[]}
          emptyHint={t("stats.historyNote")}
        />
      </Col>

      <EndSummaryModal
        summary={summary}
        unlockedNames={unlockedNames}
        bestSpeed={bestSpeedScore}
        onPlayAgain={() => window.location.reload()}
        onHome={() => router.push("/")}
        labels={{
          title: t("play.summaryTitle"),
          questions: t("play.summaryQuestions"),
          correct: t("play.summaryCorrect"),
          accuracy: t("play.summaryAccuracy"),
          xp: t("play.summaryXp"),
          hints: t("play.summaryHints"),
          combo: t("play.summaryCombo"),
          playAgain: t("play.playAgain"),
          backHome: t("play.backHome"),
          score: t("play.score"),
          newBest: t("play.newPersonalBest"),
          perfectSession: t("play.perfectSession"),
        }}
      />
    </Row>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function AttemptIndicator({
  attemptNumber,
  mode,
  comboStreak,
  locale,
}: {
  attemptNumber: number;
  mode: GameMode;
  comboStreak: number;
  locale: UiLocale;
}) {
  const { t } = useI18n();
  if (mode === "speed") {
    return (
      <div className="my-3" data-testid="attempt-indicator">
        <Badge bg={comboStreak >= 3 ? "danger" : "secondary"}>
          🔥 {t("play.combo")} {comboStreak} ·{" "}
          {t("play.multiplier", { value: Math.min(1 + Math.floor(comboStreak / 3), 3) })}
        </Badge>
      </div>
    );
  }
  const remaining = 4 - attemptNumber;
  return (
    <div
      className="my-3 d-flex justify-content-center align-items-center gap-2"
      data-testid="attempt-indicator"
    >
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`attempt-dot ${n <= attemptNumber ? `used-${n}` : ""}`}
          aria-hidden="true"
        />
      ))}
      <span className="text-secondary small ms-2">
        {t("play.attemptsLeft", { count: remaining, ...pluralVars(locale, remaining) })}
      </span>
    </div>
  );
}

function ListenPrompt({
  word,
  ttsLocale,
  prompt,
  replayLabel,
  unavailableLabel,
}: {
  word: string;
  ttsLocale: string;
  prompt: string;
  replayLabel: string;
  unavailableLabel: string;
}) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  if (!supported) {
    return <Alert variant="warning">{unavailableLabel}</Alert>;
  }
  return (
    <div className="my-3">
      <p className="text-secondary">{prompt}</p>
      <Button variant="outline-gold" size="lg" onClick={() => speak(word, ttsLocale)}>
        🔊 {replayLabel}
      </Button>
    </div>
  );
}

interface PlayControlsProps {
  mode: GameMode;
  input: string;
  onInput: (value: string) => void;
  inputError: string | null;
  onSubmit: (value?: string) => void;
  onHint: () => void;
  hintDisabled: boolean;
  onSkip: () => void;
  options?: string[];
  onChoose: (option: string) => void;
  revealed: boolean;
}

function PlayControls({
  input,
  onInput,
  inputError,
  onSubmit,
  onHint,
  hintDisabled,
  onSkip,
  options,
  onChoose,
  revealed,
}: PlayControlsProps) {
  const { t } = useI18n();

  if (revealed) {
    return <p className="text-secondary mb-0">{t("play.next")}</p>;
  }

  if (options) {
    return (
      <Row xs={1} sm={2} className="g-2">
        {options.map((option) => (
          <Col key={option}>
            <Button variant="outline-gold" className="w-100" onClick={() => onChoose(option)}>
              {option}
            </Button>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <>
      <div className="input-group input-group-lg">
        <input
          type="text"
          className="form-control"
          value={input}
          placeholder={t("play.typePlaceholder")}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          autoFocus
          aria-label={t("play.question")}
          data-testid="answer-input"
        />
        <Button variant="gold" onClick={() => onSubmit()}>
          {t("play.submit")}
        </Button>
      </div>
      {inputError && (
        <div className="text-danger small mt-1" data-testid="input-error">
          {inputError}
        </div>
      )}
      <div className="d-flex justify-content-between mt-3">
        <Button variant="outline-secondary" size="sm" onClick={onHint} disabled={hintDisabled}>
          💡 {t("play.hint")}
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={onSkip}>
          ⏭ {t("play.skip")}
        </Button>
      </div>
    </>
  );
}
