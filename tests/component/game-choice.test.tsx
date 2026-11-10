import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import GamePage from "@/components/game/GamePage";
import { useProfileStore } from "@/lib/storage/profile";
import { renderWithI18n, resetProfileStore, stubDictionaryFetch } from "../helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("mode=choice&lang=en"),
  usePathname: () => "/play",
}));

describe("GamePage — multiple-choice mode", () => {
  beforeEach(() => {
    resetProfileStore();
    stubDictionaryFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders 4 options and no phonetic answer input", async () => {
    renderWithI18n(<GamePage />);
    await screen.findByTestId("phonetic-display");
    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("btn-outline-gold"));
    expect(buttons).toHaveLength(4);
    expect(screen.queryByTestId("answer-input")).not.toBeInTheDocument();
    // Hints are not offered in choice mode.
    expect(screen.queryByText(/Hint/)).not.toBeInTheDocument();
  });

  it("records a correct pick as correct-first and advances", async () => {
    renderWithI18n(<GamePage />);
    await screen.findByTestId("phonetic-display");
    // The displayed IPA belongs to one stub word; pick its option.
    const ipa = screen.getByTestId("phonetic-display").textContent ?? "";
    const answerByIpa: Record<string, string> = {
      "kæt": "cat",
      "bæt": "bat",
      "hæt": "hat",
      "mæt": "mat",
      "dɒɡ": "dog",
      "lɒɡ": "log",
      "bɜːd": "bird",
      "tɹiː": "tree",
    };
    const answer = answerByIpa[ipa];
    expect(answer).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: answer }));
    await waitFor(() => {
      expect(useProfileStore.getState().globalCounts.correctFirst).toBe(1);
    });
  });

  it("treats a wrong pick as one attempt and allows the remaining ones", async () => {
    renderWithI18n(<GamePage />);
    await screen.findByTestId("phonetic-display");
    // Click a wrong option twice, then the right one on the 3rd attempt.
    const ipa = screen.getByTestId("phonetic-display").textContent ?? "";
    const answerByIpa: Record<string, string> = {
      "kæt": "cat",
      "bæt": "bat",
      "hæt": "hat",
      "mæt": "mat",
      "dɒɡ": "dog",
      "lɒɡ": "log",
      "bɜːd": "bird",
      "tɹiː": "tree",
    };
    const answer = answerByIpa[ipa];
    const allWords = ["cat", "bat", "hat", "mat", "dog", "log", "bird", "tree"];
    const wrong = allWords.find((w) => w !== answer && screen.queryByRole("button", { name: w }));
    expect(wrong).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: wrong! }));
    await waitFor(() => {
      // Attempt indicator shows 2 remaining attempts.
      expect(screen.getByTestId("attempt-indicator").textContent).toContain("2");
    });
    fireEvent.click(screen.getByRole("button", { name: wrong! }));
    await waitFor(() => {
      expect(screen.getByTestId("attempt-indicator").textContent).toContain("1");
    });
    fireEvent.click(screen.getByRole("button", { name: answer }));
    await waitFor(() => {
      expect(useProfileStore.getState().globalCounts.correctThird).toBe(1);
    });
  });
});
