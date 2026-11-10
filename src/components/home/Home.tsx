"use client";

/**
 * Home: hero, mode picker, language + phonetic-standard selectors, progress
 * strip and the how-to-play guide. Starting a session navigates to /play.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import ProgressBar from "react-bootstrap/ProgressBar";
import Image from "react-bootstrap/Image";
import type { GameMode, LanguageCode, PackIndex, PhoneticStandard } from "@/types/game";
import { PHONETIC_STANDARDS } from "@/types/game";
import { GAME_LANGUAGE_META, GAME_MODE_META, STANDARD_SAMPLE, standardI18nKey } from "@/lib/game/modes";
import { levelForXp } from "@/lib/game/scoring";
import { useProfileStore } from "@/lib/storage/profile";
import { useHydrated } from "@/lib/storage/useHydrated";
import { useI18n } from "@/lib/i18n/provider";
import { loadPackIndex } from "@/lib/game/dictionary";
import { withBasePath } from "@/lib/base-path";

export interface HomeProps {
  /** Injected in tests; production loads the real index. */
  packIndex?: PackIndex | null;
}

export default function Home({ packIndex: injectedIndex }: HomeProps) {
  const { t } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();

  const settings = useProfileStore((s) => s.settings);
  const lastPlayed = useProfileStore((s) => s.lastPlayed);
  const xpTotal = useProfileStore((s) => s.xpTotal);
  const streak = useProfileStore((s) => s.streak);

  const [mode, setMode] = useState<GameMode>("classic");
  const [language, setLanguage] = useState<LanguageCode | null>(null);
  const [index, setIndex] = useState<PackIndex | null>(injectedIndex ?? null);

  useEffect(() => {
    if (injectedIndex) {
      setIndex(injectedIndex);
      return;
    }
    let cancelled = false;
    loadPackIndex()
      .then((i) => {
        if (!cancelled) setIndex(i);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [injectedIndex]);

  const selectedLanguage: LanguageCode = language ?? lastPlayed?.language ?? "en";
  const level = levelForXp(hydrated ? xpTotal : 0);

  const start = () => {
    router.push(`/play?mode=${mode}&lang=${selectedLanguage}`);
  };

  return (
    <div>
      {/* Hero */}
      <Row className="align-items-center g-4 mb-4">
        <Col md={7}>
          <h1 className="display-6 fw-bold text-gold">{t("home.heroTitle")}</h1>
          <p className="lead text-secondary">{t("home.heroIntro")}</p>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span className="text-gold fs-5">{STANDARD_SAMPLE[settings.standard]}</span>
            {PHONETIC_STANDARDS.map((standard: PhoneticStandard) => (
              <Badge
                key={standard}
                bg={settings.standard === standard ? "warning" : "secondary"}
                text={settings.standard === standard ? "dark" : undefined}
                role="button"
                tabIndex={0}
                onClick={() => useProfileStore.getState().updateSettings({ standard })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    useProfileStore.getState().updateSettings({ standard });
                  }
                }}
              >
                {t(`standard.${standardI18nKey(standard)}`)}
              </Badge>
            ))}
          </div>
        </Col>
        <Col md={5} className="text-center">
          <Image
            src={withBasePath("/img/Phonetic-Word-Replicator(0).png")}
            alt={t("app.name")}
            fluid
            className="hero-logo"
          />
        </Col>
      </Row>

      {/* Progress strip */}
      <Card className="mb-4">
        <Card.Body className="d-flex flex-wrap align-items-center gap-3">
          <div>
            <div className="text-secondary small">{t("home.yourProgress")}</div>
            <div className="fs-5 fw-bold">
              {t("stats.level", { level: level.level })} ·{" "}
              {t("stats.xpTotal", { xp: hydrated ? xpTotal : 0 })}
            </div>
          </div>
          <div style={{ minWidth: "12rem", flex: 1 }}>
            <ProgressBar
              now={Math.round(level.progress * 100)}
              variant="warning"
              aria-label={`${Math.round(level.progress * 100)}%`}
            />
            <div className="text-secondary small mt-1">
              {level.level >= 100
                ? t("stats.maxLevel")
                : t("stats.xpToNext", {
                    remaining: level.xpForNext - level.xpIntoLevel,
                    next: level.level + 1,
                  })}
            </div>
          </div>
          <div className="text-center">
            <div className="fs-5">🔥 {hydrated ? streak.current : 0}</div>
            <div className="text-secondary small">{t("stats.streak")}</div>
          </div>
        </Card.Body>
      </Card>

      {/* Mode picker */}
      <h2 className="h4 text-gold mb-3">{t("home.chooseMode")}</h2>
      <Row xs={1} md={2} lg={3} className="g-3 mb-4">
        {(Object.keys(GAME_MODE_META) as GameMode[]).map((modeId) => {
          const meta = GAME_MODE_META[modeId];
          return (
            <Col key={modeId}>
              <Card
                className={`mode-card ${mode === modeId ? "selected" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => setMode(modeId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setMode(modeId);
                }}
              >
                <Card.Body>
                  <Card.Title>
                    {meta.icon} {t(`modes.${meta.i18nKey}.name`)}
                  </Card.Title>
                  <Card.Text className="text-secondary small">
                    {t(`modes.${meta.i18nKey}.tagline`)}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Language picker */}
      <h2 className="h4 text-gold mb-3">{t("home.chooseLanguage")}</h2>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {(Object.keys(GAME_LANGUAGE_META) as LanguageCode[]).map((code) => {
          const meta = GAME_LANGUAGE_META[code];
          const count = index?.languages[code]?.count;
          return (
            <Button
              key={code}
              variant="outline-secondary"
              className={`lang-flag-btn ${selectedLanguage === code ? "selected" : ""}`}
              style={{ backgroundImage: `url(${withBasePath(`/img/flags/${meta.flag}`)})` }}
              onClick={() => setLanguage(code)}
              aria-pressed={selectedLanguage === code}
            >
              {meta.endonym}
              {count !== undefined ? (
                <Badge bg="dark" className="ms-2">
                  {t("language.wordsAvailable", { count })}
                </Badge>
              ) : null}
            </Button>
          );
        })}
      </div>

      <div className="d-flex gap-2 mb-5">
        <Button size="lg" variant="gold" onClick={start}>
          {t("home.start")} →
        </Button>
        <Link href="/stats" passHref legacyBehavior>
          <Button size="lg" variant="outline-secondary">
            {t("nav.stats")}
          </Button>
        </Link>
      </div>

      {/* How it works */}
      <Card>
        <Card.Body>
          <Card.Title className="text-gold">{t("home.howToPlay")}</Card.Title>
          <ol className="mb-0 text-secondary">
            <li>{t("home.rule1")}</li>
            <li>{t("home.rule2")}</li>
            <li>{t("home.rule3")}</li>
            <li>{t("home.rule4")}</li>
          </ol>
        </Card.Body>
      </Card>
    </div>
  );
}
