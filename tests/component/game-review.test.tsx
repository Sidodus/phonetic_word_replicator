import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import GamePage from "@/components/game/GamePage";
import { useProfileStore } from "@/lib/storage/profile";
import { renderWithI18n, resetProfileStore, stubDictionaryFetch } from "../helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("mode=review&lang=en"),
  usePathname: () => "/play",
}));

const ANSWER_BY_IPA: Record<string, string> = {
  "kæt": "cat",
  "bæt": "bat",
  "hæt": "hat",
  "mæt": "mat",
  "dɒɡ": "dog",
  "lɒɡ": "log",
  "bɜːd": "bird",
  "tɹiː": "tree",
};

/** Seed the review bank with due words from the stub pack. */
function seedBank(words: string[], box = 0, seenDaysAgo = 1) {
  const entries: Record<string, {
    word: string;
    box: number;
    lastSeen: number;
    lastOutcome: string;
  }> = {};
  for (const word of words) {
    entries[`en:${word}`] = {
      word,
      box,
      lastSeen: Date.now() - seenDaysAgo * 24 * 3_600_000,
      lastOutcome: "correct-first",
    };
  }
  useProfileStore.setState({
    review: { entries: entries as never },
  });
}

describe("GamePage — review mode", () => {
  beforeEach(() => {
    resetProfileStore();
    stubDictionaryFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the friendly empty state when nothing is due", async () => {
    renderWithI18n(<GamePage />);
    const empty = await screen.findByTestId("review-empty");
    expect(empty).toHaveTextContent("Nothing to review right now");
    expect(screen.queryByTestId("phonetic-display")).not.toBeInTheDocument();
  });

  it("asks only the due bank words", async () => {
    seedBank(["cat", "tree"]);
    renderWithI18n(<GamePage />);
    const display = await screen.findByTestId("phonetic-display");
    const ipa = display.textContent ?? "";
    expect(ANSWER_BY_IPA[ipa]).toBeTruthy();
    expect(["kæt", "tɹiː"]).toContain(ipa); // a bank word, not the whole pack
  });

  it("persists review answers into the bank via the store", async () => {
    seedBank(["cat"]);
    renderWithI18n(<GamePage />);
    const display = await screen.findByTestId("phonetic-display");
    const answer = ANSWER_BY_IPA[display.textContent ?? ""];
    fireEvent.change(screen.getByTestId("answer-input"), { target: { value: answer } });
    fireEvent.click(screen.getByText("Check"));
    await waitFor(() => {
      const entry = useProfileStore.getState().review.entries["en:cat"];
      // First-try correct promoted the word out of box 0.
      expect(entry.box).toBe(1);
    });
    // The session ends after the single due word is answered.
    await waitFor(() => {
      expect(screen.getByText("Session summary")).toBeInTheDocument();
    });
  });
});
