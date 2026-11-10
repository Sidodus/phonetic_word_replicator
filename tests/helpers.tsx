/**
 * Shared helpers for component tests.
 */

import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { ReactElement } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { createEmptyProfile, useProfileStore } from "@/lib/storage/profile";

export function renderWithI18n(ui: ReactElement): ReturnType<typeof render> {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

export function resetProfileStore(): void {
  useProfileStore.setState({ ...createEmptyProfile() });
  window.localStorage.clear();
}

/**
 * Stub the global fetch to serve a tiny curated pack for any dictionary
 * request. Returns the mock for assertions.
 */
export function stubDictionaryFetch(): ReturnType<typeof vi.fn> {
  const pack = {
    meta: {
      lang: "en",
      version: 2,
      generatedAt: "2026-11-10",
      source: "test",
      count: 8,
      tiers: { starter: 8, core: 0, advanced: 0 },
    },
    entries: [
      { w: "cat", ipa: "kæt", xs: "k{t", tier: "starter" },
      { w: "bat", ipa: "bæt", xs: "b{t", tier: "starter" },
      { w: "hat", ipa: "hæt", xs: "h{t", tier: "starter" },
      { w: "mat", ipa: "mæt", xs: "m{t", tier: "starter" },
      { w: "dog", ipa: "dɒɡ", xs: "dQg", tier: "starter" },
      { w: "log", ipa: "lɒɡ", xs: "lQg", tier: "starter" },
      { w: "bird", ipa: "bɜːd", xs: "b3:d", tier: "starter" },
      { w: "tree", ipa: "tɹiː", xs: "tr\\i:", tier: "starter" },
    ],
  };
  const index = { version: 2, generatedAt: "2026-11-10", languages: {} };
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (String(url).endsWith("index.json")) {
      return Promise.resolve(new Response(JSON.stringify(index), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify(pack), { status: 200 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
