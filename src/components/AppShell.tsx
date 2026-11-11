"use client";

/**
 * Client application shell: i18n provider, navigation, settings modal and the
 * site footer. Every page renders inside this shell.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import { I18nProvider, useI18n } from "@/lib/i18n/provider";
import { UI_LOCALE_META, type UiLocale } from "@/lib/i18n";
import { PROFILE_STORAGE_KEY, useProfileStore } from "@/lib/storage/profile";
import { useHydrated } from "@/lib/storage/useHydrated";
import { withBasePath } from "@/lib/base-path";
import SettingsModal from "@/components/stats/SettingsModal";

/** Register the offline service worker (production static builds only). */
function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register(withBasePath("/sw.js")).catch(() => undefined);
}

/** Read the stored UI locale preference without hydrating the whole store. */
function readStoredLocale(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { settings?: { uiLocale?: string } } };
    return parsed.state?.settings?.uiLocale ?? null;
  } catch {
    return null;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t, locale, changeLocale } = useI18n();
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const hydrated = useHydrated();

  // One-time best-effort import of v1 progress (idempotent inside the store).
  useEffect(() => {
    if (hydrated) {
      useProfileStore.getState().importV1();
    }
  }, [hydrated]);

  // Offline support (PWA) — registration is a bonus, never a crash.
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const handleUiLocale = useCallback(
    async (next: UiLocale | "auto") => {
      await changeLocale(next);
      useProfileStore.getState().updateSettings({ uiLocale: next });
    },
    [changeLocale],
  );

  return (
    <>
      <Navbar variant="dark" expand="sm" className="border-bottom border-secondary-subtle">
        <Container>
          <Navbar.Brand as={Link} href="/" className="d-flex align-items-center gap-2">
            <Image
              src={withBasePath("/img/Phonetic-Word-Replicator(1).png")}
              alt=""
              width={32}
              height={32}
              className="d-inline-block align-top"
            />
            <span className="nav-brand-title">{t("app.name")}</span>
            <span className="badge text-bg-secondary">{t("app.v2")}</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto" activeKey={pathname}>
              <Nav.Link as={Link} href="/" eventKey="/">
                {t("nav.home")}
              </Nav.Link>
              <Nav.Link as={Link} href="/play" eventKey="/play">
                {t("nav.play")}
              </Nav.Link>
              <Nav.Link as={Link} href="/stats" eventKey="/stats">
                {t("nav.stats")}
              </Nav.Link>
            </Nav>
            <Button
              variant="outline-gold"
              size="sm"
              onClick={() => setShowSettings(true)}
              aria-label={t("settings.title")}
            >
              ⚙️ {t("nav.settings")}
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container as="main" className="py-4">
        {children}
      </Container>

      <footer className="site-footer border-top border-secondary-subtle py-4">
        <Container>
          <p className="mb-1">
            {t("credits.createdBy")} <strong>Saheed Odulaja</strong> ·{" "}
            <a
              href="https://github.com/Sidodus/phonetic_word_replicator"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>{" "}
            · <code>{t("app.phonetic")}</code>
          </p>
          <p className="mb-0">{t("credits.dataDesc")}</p>
        </Container>
      </footer>

      <SettingsModal
        show={showSettings}
        onHide={() => setShowSettings(false)}
        uiLocale={locale}
        onChangeUiLocale={handleUiLocale}
        localeNames={UI_LOCALE_META}
      />
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider getStoredLocale={readStoredLocale} fallback={<LoadingScreen />}>
      <Shell>{children}</Shell>
    </I18nProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="text-center">
        <div className="spinner-border text-warning mb-3" role="status" aria-hidden="true" />
        <p className="text-secondary">…</p>
      </div>
    </div>
  );
}
