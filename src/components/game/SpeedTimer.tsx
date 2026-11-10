"use client";

/**
 * Speed-mode countdown bar with urgency styling.
 */

import ProgressBar from "react-bootstrap/ProgressBar";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";

export default function SpeedTimer({
  secondsLeft,
  total,
  bestLabel,
}: {
  secondsLeft: number;
  total: number;
  bestLabel: string;
}) {
  const urgent = secondsLeft <= 10;
  return (
    <Card>
      <Card.Body className="py-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <Badge bg={urgent ? "danger" : "secondary"} className={urgent ? "timer-urgent" : ""}>
            ⏱ {secondsLeft}s
          </Badge>
          <span className="text-secondary small">{bestLabel}</span>
        </div>
        <ProgressBar
          now={Math.max(0, Math.round((secondsLeft / total) * 100))}
          variant={urgent ? "danger" : "warning"}
          aria-label={`${secondsLeft} seconds remaining`}
        />
      </Card.Body>
    </Card>
  );
}
