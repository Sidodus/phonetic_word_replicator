"use client";

/**
 * End-of-session modal: accuracy, XP, combo, mode-specific highlights and any
 * newly unlocked achievement names.
 */

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Badge from "react-bootstrap/Badge";
import ListGroup from "react-bootstrap/ListGroup";
import { useMemo } from "react";
import type { SessionSummary } from "@/types/game";
import { computeOutcomeStats } from "@/lib/game/scoring";

export interface EndSummaryLabels {
  title: string;
  questions: string;
  correct: string;
  accuracy: string;
  xp: string;
  hints: string;
  combo: string;
  playAgain: string;
  backHome: string;
  score: string;
  newBest: string;
  perfectSession: string;
}

export interface EndSummaryModalProps {
  summary: SessionSummary | null;
  unlockedNames: string[];
  bestSpeed: number;
  labels: EndSummaryLabels;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function EndSummaryModal({
  summary,
  unlockedNames,
  bestSpeed,
  labels,
  onPlayAgain,
  onHome,
}: EndSummaryModalProps) {
  const stats = useMemo(
    () =>
      summary
        ? computeOutcomeStats({
            correctFirst: summary.records.filter((r) => r.outcome === "correct-first").length,
            correctSecond: summary.records.filter((r) => r.outcome === "correct-second").length,
            correctThird: summary.records.filter((r) => r.outcome === "correct-third").length,
            wrong: summary.records.filter((r) => r.outcome === "failed").length,
            skipped: summary.records.filter((r) => r.outcome === "skipped").length,
          })
        : null,
    [summary],
  );

  const perfect =
    summary !== undefined &&
    summary !== null &&
    summary.questionsInSession >= 10 &&
    summary.correctFirstInSession === summary.questionsInSession;

  const isSpeed = summary?.mode === "speed";
  const newBest = isSpeed && summary !== null && summary.speedScore > 0 && summary.speedScore >= bestSpeed;

  return (
    <Modal show={summary !== null} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>{labels.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {summary && stats && (
          <>
            {isSpeed ? (
              <div className="text-center mb-3">
                <div className="display-6 fw-bold text-gold">{summary.speedScore}</div>
                <div className="text-secondary">{labels.score}</div>
                {newBest && (
                  <Badge bg="warning" text="dark" className="mt-2">
                    🏆 {labels.newBest}
                  </Badge>
                )}
              </div>
            ) : null}

            {perfect && (
              <div className="alert alert-warning text-center py-2">
                💎 {labels.perfectSession}
              </div>
            )}

            <Row xs={2} md={3} className="g-2 mb-3">
              <Stat label={labels.questions} value={String(stats.total)} />
              <Stat label={labels.correct} value={String(stats.accuracyPct ? Math.round((stats.accuracyPct / 100) * stats.total) : 0)} />
              <Stat label={labels.accuracy} value={`${stats.accuracyPct}%`} />
              <Stat label={labels.xp} value={String(summary.xpEarned)} />
              <Stat label={labels.hints} value={String(summary.hintsUsed)} />
              <Stat label={labels.combo} value={String(summary.bestCombo)} />
            </Row>

            {unlockedNames.length > 0 && (
              <ListGroup className="mb-3" data-testid="new-achievements">
                {unlockedNames.map((name) => (
                  <ListGroup.Item key={name} className="bg-transparent">
                    🏅 {name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHome}>
          {labels.backHome}
        </Button>
        <Button variant="gold" onClick={onPlayAgain}>
          {labels.playAgain}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-raised rounded p-2 text-center">
      <div className="fw-bold">{value}</div>
      <div className="text-secondary small">{label}</div>
    </div>
  );
}
