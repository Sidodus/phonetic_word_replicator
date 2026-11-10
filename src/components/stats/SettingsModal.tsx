"use client";

/**
 * Global settings: phonetic standard, answer matching, sound, TTS autoplay,
 * interface language. Persisted through the profile store.
 */

import { useMemo } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { PHONETIC_STANDARDS, type PhoneticStandard } from "@/types/game";
import { STANDARD_SAMPLE, standardI18nKey } from "@/lib/game/modes";
import { useProfileStore } from "@/lib/storage/profile";
import { useI18n } from "@/lib/i18n/provider";
import { speak } from "@/lib/speech/tts";
import type { UiLocaleMeta } from "@/lib/i18n";

export interface SettingsModalProps {
  show: boolean;
  onHide: () => void;
  uiLocale: string;
  onChangeUiLocale: (locale: UiLocaleChoice) => void;
  localeNames: Record<string, UiLocaleMeta>;
}

export type UiLocaleChoice = UiLocaleMeta["code"] | "auto";

export default function SettingsModal({
  show,
  onHide,
  uiLocale,
  onChangeUiLocale,
  localeNames,
}: SettingsModalProps) {
  const { t } = useI18n();
  const settings = useProfileStore((s) => s.settings);
  const updateSettings = useProfileStore((s) => s.updateSettings);

  const localeOptions = useMemo(
    () => ["auto", ...Object.keys(localeNames)] as UiLocaleChoice[],
    [localeNames],
  );

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t("settings.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="settings-standard">
            <Form.Label className="text-gold fw-semibold">
              {t("settings.standard")}
            </Form.Label>
            <div>
              {PHONETIC_STANDARDS.map((standard: PhoneticStandard) => (
                <Form.Check
                  key={standard}
                  inline
                  type="radio"
                  name="phonetic-standard"
                  id={`standard-${standard}`}
                  label={`${t(`standard.${standardI18nKey(standard)}`)} — ${
                    STANDARD_SAMPLE[standard]
                  }`}
                  checked={settings.standard === standard}
                  onChange={() => updateSettings({ standard })}
                />
              ))}
            </div>
            <Form.Text muted>
              {settings.standard === "IPA"
                ? t("settings.ipaDesc")
                : t("settings.xsampaDesc")}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="settings-matching">
            <Form.Label className="text-gold fw-semibold">{t("settings.matching")}</Form.Label>
            <Form.Check
              type="radio"
              name="accent-matching"
              id="matching-lenient"
              label={t("settings.accentLenient")}
              checked={settings.accentInsensitive}
              onChange={() => updateSettings({ accentInsensitive: true })}
            />
            <Form.Check
              type="radio"
              name="accent-matching"
              id="matching-strict"
              label={t("settings.accentStrict")}
              checked={!settings.accentInsensitive}
              onChange={() => updateSettings({ accentInsensitive: false })}
            />
            <Form.Text muted>{t("settings.matchingHint")}</Form.Text>
          </Form.Group>

          <Row className="g-2 mb-3">
            <Col>
              <Form.Check
                id="settings-sound"
                type="switch"
                label={t("settings.sound")}
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              />
            </Col>
            <Col>
              <Form.Check
                id="settings-autopronounce"
                type="switch"
                label={t("settings.autoPronounce")}
                checked={settings.autoPronounce}
                onChange={(e) => updateSettings({ autoPronounce: e.target.checked })}
              />
            </Col>
          </Row>

          <Form.Group controlId="settings-ui-locale">
            <Form.Label className="text-gold fw-semibold">{t("settings.uiLanguage")}</Form.Label>
            <Form.Select
              value={uiLocale}
              onChange={(e) => onChangeUiLocale(e.target.value as UiLocaleChoice)}
            >
              {localeOptions.map((code) => (
                <option key={code} value={code}>
                  {code === "auto" ? t("settings.auto") : localeNames[code].endonym}
                </option>
              ))}
            </Form.Select>
            <div className="mt-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => speak("dictionary", "en-US")}
              >
                🔊 TTS preview
              </Button>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {t("settings.close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
