"use client";

/**
 * Stats dashboard: level progress, win rates (global + per language),
 * achievements, daily calendar, attempt history and data controls.
 */

import { useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Alert from "react-bootstrap/Alert";
import NamedProgress from "@/components/ui/NamedProgress";
import type { LanguageCode } from "@/types/game";
import { GAME_LANGUAGE_META } from "@/lib/game/modes";
import {
  ACHIEVEMENTS,
} from "@/lib/game/achievements";
import { computeOutcomeStats, levelForXp } from "@/lib/game/scoring";
import {
  achievementSnapshotOf,
  outcomeCountsOfStats,
  selectGlobalOutcomeStats,
  useProfileStore,
} from "@/lib/storage/profile";
import { useHydrated } from "@/lib/storage/useHydrated";
import { useI18n, pluralVars } from "@/lib/i18n/provider";
import { dateKey, parseDateKey } from "@/lib/game/rng";
import { evaluateAchievements } from "@/lib/game/achievements";

export default function StatsDashboard() {
  const { t, locale } = useI18n();
  const hydrated = useHydrated();
  const profile = useProfileStore((s) => s);
  const resetProfile = useProfileStore((s) => s.resetProfile);

  const [showReset, setShowReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const globalStats = useMemo(
    () =>
      selectGlobalOutcomeStats({
        ...profile,
        globalCounts: hydrated
          ? profile.globalCounts
          : {
              correctFirst: 0,
              correctSecond: 0,
              correctThird: 0,
              wrong: 0,
              skipped: 0,
              sessionsCompleted: 0,
              hintsUsed: 0,
              bestCombo: 0,
              perfectSessions: 0,
              listenRoundsCompleted: 0,
            },
      }),
    [profile, hydrated],
  );

  const level = levelForXp(hydrated ? profile.xpTotal : 0);
  const hasData = hydrated && globalStats.total > 0;

  const unlockedCount = Object.keys(profile.achievements).length;

  const calendarDays = useMemo(() => {
    // Last 28 days ending today, oldest first.
    const days: { key: string; done: boolean; accuracy: number; today: boolean }[] = [];
    const today = dateKey(new Date());
    const cursor = parseDateKey(today);
    for (let i = 0; i < 28; i++) {
      const key = dateKey(cursor);
      const entry = hydrated ? profile.dailyCalendar[key] : undefined;
      days.unshift({
        key,
        done: Boolean(entry),
        accuracy: entry?.accuracyPct ?? 0,
        today: key === today,
      });
      cursor.setDate(cursor.getDate() - 1);
    }
    return days;
  }, [profile.dailyCalendar, hydrated]);

  return (
    <div>
      <h1 className="h3 text-gold mb-4">{t("stats.title")}</h1>

      {!hydrated && (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status" aria-hidden="true" />
        </div>
      )}

      {hydrated && !hasData && (
        <Alert variant="secondary">{t("stats.noData")}</Alert>
      )}

      {hydrated && (
        <>
          {/* Overview */}
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Card className="h-100">
                <Card.Body>
                  <div className="text-secondary small">{t("stats.level", { level: level.level })}</div>
                  <div className="fs-4 fw-bold">{t("stats.xpTotal", { xp: profile.xpTotal })}</div>
                  <NamedProgress
                    value={level.progress * 100}
                    label={`${t("stats.level", { level: level.level })} progress`}
                    variant="warning"
                    className="mt-2"
                  />
                  <div className="text-secondary small mt-1">
                    {level.level >= 100
                      ? t("stats.maxLevel")
                      : t("stats.xpToNext", {
                          remaining: level.xpForNext - level.xpIntoLevel,
                          next: level.level + 1,
                        })}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100">
                <Card.Body>
                  <div className="text-secondary small">{t("stats.streak")}</div>
                  <div className="fs-4 fw-bold">
                    🔥 {t("stats.streakDays", { count: profile.streak.current, ...pluralVars(locale, profile.streak.current) })}
                  </div>
                  <div className="text-secondary small">
                    {t("stats.longestStreak", { count: profile.streak.longest, ...pluralVars(locale, profile.streak.longest) })}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100">
                <Card.Body>
                  <div className="text-secondary small">{t("stats.total")}</div>
                  <div className="fs-4 fw-bold">{globalStats.total}</div>
                  <div className="text-secondary small">
                    {t("stats.accuracy")}: {globalStats.accuracyPct}% · {t("stats.firstTryAccuracy")}:{" "}
                    {globalStats.firstTryAccuracyPct}%
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Win rates */}
          <Row className="g-3 mb-4">
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="text-gold fw-semibold">{t("stats.winRates")}</Card.Header>
                <Table striped hover className="mb-0" data-testid="win-rates">
                  <caption className="visually-hidden">{t("stats.winRates")}</caption>
                  <tbody>
                    <WinRateRow label={t("stats.outcomeFirst")} count={globalStats.correctFirst} pct={globalStats.correctFirstPct} variant="primary" />
                    <WinRateRow label={t("stats.outcomeSecond")} count={globalStats.correctSecond} pct={globalStats.correctSecondPct} variant="warning" />
                    <WinRateRow label={t("stats.outcomeThird")} count={globalStats.correctThird} pct={globalStats.correctThirdPct} variant="danger" />
                    <WinRateRow label={t("stats.outcomeWrong")} count={globalStats.wrong} pct={globalStats.wrongPct} variant="secondary" />
                    <WinRateRow label={t("stats.outcomeSkipped")} count={globalStats.skipped} pct={globalStats.skippedPct} variant="secondary" />
                    <tr>
                      <th scope="row" className="fw-bold">
                        {t("stats.accuracy")}
                      </th>
                      <td className="fw-bold">{globalStats.accuracyPct}%</td>
                      <td />
                    </tr>
                  </tbody>
                </Table>
              </Card>
            </Col>

            {/* Per-language */}
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="text-gold fw-semibold">{t("stats.perLanguage")}</Card.Header>
                <Table striped hover className="mb-0" data-testid="per-language">
                  <thead>
                    <tr>
                      <th>{t("language.label")}</th>
                      <th>{t("stats.total")}</th>
                      <th>{t("stats.accuracy")}</th>
                      <th>{t("stats.sessions")}</th>
                      <th>{t("stats.speedBest")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(GAME_LANGUAGE_META) as LanguageCode[]).map((code) => {
                      const stats = computeOutcomeStats(outcomeCountsOfStats(profile.languageStats[code]));
                      const langStats = profile.languageStats[code];
                      return (
                        <tr key={code} className={stats.total === 0 ? "text-secondary" : ""}>
                          <td>{GAME_LANGUAGE_META[code].endonym}</td>
                          <td>{stats.total}</td>
                          <td>{stats.total === 0 ? "—" : `${stats.accuracyPct}%`}</td>
                          <td>{langStats.sessionsCompleted}</td>
                          <td>{profile.bestSpeedScore[code] ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card>
            </Col>
          </Row>

          {/* Achievements */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between">
              <span className="text-gold fw-semibold">{t("stats.achievements")}</span>
              <Badge bg="secondary">
                {t("stats.achievementsUnlocked", { unlocked: unlockedCount, total: ACHIEVEMENTS.length })}
              </Badge>
            </Card.Header>
            <Card.Body>
              <Row xs={2} md={4} lg={4} className="g-2">
                {ACHIEVEMENTS.map((achievement) => {
                  const unlockedAt = profile.achievements[achievement.id];
                  return (
                    <Col key={achievement.id}>
                      <div
                        className={`achievement-tile ${unlockedAt ? "" : "locked"}`}
                        title={unlockedAt ? t("stats.unlockedOn", { date: unlockedAt.slice(0, 10) }) : t("stats.locked")}
                        data-testid={`achievement-${achievement.id}`}
                      >
                        <div className="achievement-icon">{achievement.icon}</div>
                        <div className="small fw-semibold">{t(`achievements.${achievement.i18nKey}.name`)}</div>
                        <div className="text-secondary" style={{ fontSize: "0.72rem" }}>
                          {t(`achievements.${achievement.i18nKey}.description`)}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>

          {/* Daily calendar */}
          <Card className="mb-4">
            <Card.Header className="text-gold fw-semibold">{t("stats.dailyCalendar")}</Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-1" data-testid="daily-calendar">
                {calendarDays.map((day) => (
                  <span
                    key={day.key}
                    className={`calendar-day ${day.done ? "done" : ""} ${day.today ? "today" : ""}`}
                    title={`${day.key}${day.done ? ` · ${day.accuracy}%` : ""}`}
                  >
                    {day.key.slice(8)}
                  </span>
                ))}
              </div>
              {Object.keys(profile.dailyCalendar).length === 0 && (
                <p className="text-secondary small mt-2 mb-0">{t("stats.dailyEmpty")}</p>
              )}
            </Card.Body>
          </Card>

          {/* History */}
          <Card className="mb-4">
            <Card.Header className="text-gold fw-semibold">{t("stats.history")}</Card.Header>
            <Card.Body>
              {profile.history.length === 0 ? (
                <p className="text-secondary small mb-0">{t("stats.historyEmpty")}</p>
              ) : (
                <>
                  <p className="text-secondary small">{t("stats.historyNote")}</p>
                  <div className="d-flex flex-wrap gap-2" data-testid="history">
                    {[...profile.history]
                      .slice(0, 100)
                      .map((record, index) => (
                        <a
                          key={`${record.word}-${record.answeredAt}-${index}`}
                          className={`history-link badge text-bg-${
                            record.outcome === "correct-first"
                              ? "primary"
                              : record.outcome === "correct-second"
                                ? "warning text-dark"
                                : record.outcome === "correct-third"
                                  ? "danger"
                                  : "secondary"
                          }`}
                          href={`https://en.wiktionary.org/wiki/${encodeURIComponent(record.word)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {record.word}
                        </a>
                      ))}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Danger zone */}
          <Card border="danger">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <span className="text-secondary small">{t("stats.resetConfirmBody")}</span>
              <Button variant="outline-danger" onClick={() => setShowReset(true)}>
                {t("stats.resetData")}
              </Button>
            </Card.Body>
          </Card>

          <Modal show={showReset} onHide={() => setShowReset(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>{t("stats.resetConfirmTitle")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{t("stats.resetConfirmBody")}</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowReset(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  resetProfile();
                  setShowReset(false);
                  setResetDone(true);
                }}
              >
                {t("stats.resetData")}
              </Button>
            </Modal.Footer>
          </Modal>

          {resetDone && (
            <Alert variant="success" className="mt-3" onClose={() => setResetDone(false)} dismissible>
              {t("stats.noData")}
            </Alert>
          )}
        </>
      )}
    </div>
  );
}

function WinRateRow({
  label,
  count,
  pct,
  variant,
}: {
  label: string;
  count: number;
  pct: number;
  variant: string;
}) {
  return (
    <tr>
      <th scope="row">
        <span className={`badge text-bg-${variant} ${variant === "warning" ? "text-dark" : ""}`}>
          {count}
        </span>{" "}
        {label}
      </th>
      <td className="text-end fw-semibold">{pct}%</td>
      <td style={{ width: "30%" }}>
        <NamedProgress value={pct} label={label} variant={variant} style={{ height: 6 }} />
      </td>
    </tr>
  );
}

// Snapshot helper retained for tests re-using this module.
export { achievementSnapshotOf, evaluateAchievements };
