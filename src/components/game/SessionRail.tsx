"use client";

/**
 * Right-hand rail: live list of attempted words with the v1 colour coding
 * (blue/yellow/red/grey badges) and Wiktionary lookup links.
 */

import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import type { AttemptRecord } from "@/types/game";
import { badgeVariantFor } from "@/lib/game/scoring";

export default function SessionRail({
  title,
  records,
  emptyHint,
}: {
  title: string;
  records: AttemptRecord[];
  emptyHint?: string;
}) {
  // Newest first.
  const ordered = [...records].reverse();
  return (
    <Card>
      <Card.Header className="fw-semibold">{title}</Card.Header>
      <Card.Body className="p-2">
        <ListGroup variant="flush" className="session-rail" data-testid="session-rail">
          {ordered.length === 0 && (
            <ListGroup.Item className="text-secondary small bg-transparent">
              {emptyHint}
            </ListGroup.Item>
          )}
          {ordered.map((record, index) => (
            <ListGroup.Item
              key={`${record.word}-${record.answeredAt}-${index}`}
              className="rail-item d-flex justify-content-between align-items-center bg-transparent"
            >
              <code className="small text-gold-light">
                /{record.mode === "listen" ? "🔊" : record.ipa}/
              </code>
              <a
                className={`history-link badge text-bg-${badgeVariantFor(record.outcome)} ${
                  record.outcome === "correct-second" ? "text-dark" : ""
                }`}
                href={`https://en.wiktionary.org/wiki/${encodeURIComponent(record.word)}`}
                target="_blank"
                rel="noreferrer"
              >
                {record.word}
              </a>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
