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
import Image from "react-bootstrap/Image";
import type { GameMode, LanguageCode, PackIndex, PhoneticStandard } from "@/types/game";
import { PHONETIC_STANDARDS } from "@/types/game";
import { GAME_LANGUAGE_META, GAME_MODE_META, STANDARD_SAMPLE, standardI18nKey } from "@/lib/game/modes";
import { levelForXp } from "@/lib/game/scoring";
import { countDueReview } from "@/lib/game/review";
import { subscribeToVoices, ttsSupportForLocale, type VoiceInfo } from "@/lib/speech/voices";
import { useProfileStore } from "@/lib/storage/profile";
import { useHydrated } from "@/lib/storage/useHydrated";
import { useI18n, pluralVars } from "@/lib/i18n/provider";
import { loadPackIndex } from "@/lib/game/dictionary";
import { withBasePath } from "@/lib/base-path";
import NamedProgress from "@/components/ui/NamedProgress";

export interface HomeProps {
  /** Injected in tests; production loads the real index. */
  packIndex?: PackIndex | null;
}

export default function Home({ packIndex: injectedIndex }: HomeProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();

  const settings = useProfileStore((s) => s.settings);
  const lastPlayed = useProfileStore((s) => s.lastPlayed);
  const xpTotal = useProfileStore((s) => s.xpTotal);
  const streak = useProfileStore((s) => s.streak);

  const [mode, setMode] = useState<GameMode>("classic");
  const [language, setLanguage] = useState<LanguageCode | null>(null);
  const [index, setIndex] = useState<PackIndex | null>(injectedIndex ?? null);
  const [now, setNow] = useState(() => Date.now());
  const [voiceSupport, setVoiceSupport] = useState<Record<string, boolean | null>>({});

  const reviewEntries = useProfileStore((s) => s.review.entries);

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

  // TTS pre-flight: which languages have a speech voice in this browser.
  useEffect(() => {
    return subscribeToVoices((voices: VoiceInfo[]) => {
      const support: Record<string, boolean> = {};
      for (const code of Object.keys(GAME_LANGUAGE_META) as LanguageCode[]) {
        support[code] = ttsSupportForLocale(GAME_LANGUAGE_META[code].ttsLocale, voices);
      }
      setVoiceSupport(support);
    });
  }, []);

  // Refresh the review-due count periodically (words become due over time).
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const selectedLanguage: LanguageCode = language ?? lastPlayed?.language ?? "en";
  const level = levelForXp(hydrated ? xpTotal : 0);
  const dueCount = hydrated ? countDueReview(reviewEntries, selectedLanguage, now) : 0;

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
            <NamedProgress
              value={level.progress * 100}
              label={`${t("stats.level", { level: level.level })} progress`}
              variant="warning"
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

      {/* Wobbly-words review card (only when something is due) */}
      {dueCount > 0 && (
        <Card className="mb-4 border-warning-subtle">
          <Card.Body className="d-flex flex-wrap align-items-center gap-3">
            <div style={{ fontSize: "1.8rem" }}>🔁</div>
            <div style={{ flex: 1 }}>
              <div className="fw-semibold">{t("home.reviewTitle")}</div>
              <div className="text-secondary small">
                {t("home.reviewDueBody", {
                  count: dueCount,
                  ...pluralVars(locale, dueCount),
                })}
              </div>
            </div>
            <Button
              variant="outline-gold"
              onClick={() => router.push(`/play?mode=review&lang=${selectedLanguage}`)}
            >
              {t("home.reviewStart")}
            </Button>
          </Card.Body>
        </Card>
      )}

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
          const tts = voiceSupport[code] ?? null;
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
              {tts !== null && (
                <span
                  className="ms-1"
                  title={tts ? t("home.ttsOk") : t("home.ttsNo")}
                  aria-label={tts ? t("home.ttsOk") : t("home.ttsNo")}
                >
                  {tts ? "🔊" : "🔇"}
                </span>
              )}
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
