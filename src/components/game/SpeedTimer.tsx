"use client";

/**
 * Speed-mode countdown bar with urgency styling.
 */

import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import NamedProgress from "@/components/ui/NamedProgress";

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
        <NamedProgress
          value={(secondsLeft / total) * 100}
          label={`${secondsLeft} seconds remaining`}
          variant={urgent ? "danger" : "warning"}
        />
      </Card.Body>
    </Card>
  );
}
