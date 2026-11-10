import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import GamePage from "@/components/game/GamePage";
import { useProfileStore } from "@/lib/storage/profile";
import { renderWithI18n, resetProfileStore, stubDictionaryFetch } from "../helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("mode=classic&lang=en"),
  usePathname: () => "/play",
}));

/** IPA (default standard) → word for the stubbed pack. */
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

async function startClassic() {
  renderWithI18n(<GamePage />);
  const display = await screen.findByTestId("phonetic-display");
  return display.textContent ?? "";
}

async function answerCorrectly(): Promise<string> {
  const ipa = screen.getByTestId("phonetic-display").textContent ?? "";
  const answer = ANSWER_BY_IPA[ipa];
  expect(answer, `no stub answer for IPA ${ipa}`).toBeTruthy();
  const input = screen.getByTestId("answer-input");
  fireEvent.change(input, { target: { value: answer } });
  fireEvent.click(screen.getByText("Check"));
  return answer;
}

describe("GamePage — classic mode", () => {
  beforeEach(() => {
    resetProfileStore();
    stubDictionaryFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks empty submissions with an inline error", async () => {
    await startClassic();
    fireEvent.click(screen.getByText("Check"));
    expect(screen.getByTestId("input-error")).toHaveTextContent("Type an answer first");
    // The session did not advance.
    expect(useProfileStore.getState().globalCounts.correctFirst).toBe(0);
  });

  it("accepts a correct first-try answer, pays XP and advances", async () => {
    await startClassic();
    await answerCorrectly();
    // The rail gains one blue-correct entry.
    await waitFor(() => {
      expect(screen.getByTestId("session-rail").querySelectorAll("a.badge")).toHaveLength(1);
    });
    // The next question is displayed with a fresh attempt row.
    expect(screen.getByTestId("answer-input")).toBeInTheDocument();
  });

  it("shows a hint mask once and disables further hints", async () => {
    await startClassic();
    fireEvent.click(screen.getByText(/Hint/));
    const mask = screen.getByTestId("hint-mask");
    expect(mask.textContent).toContain("_");
    expect(screen.getByText(/Hint/)).toBeDisabled();
  });

  it("reveals the answer after the third miss and auto-advances", async () => {
    await startClassic();
    vi.useFakeTimers();
    try {
      const input = screen.getByTestId("answer-input");
      for (let i = 0; i < 3; i++) {
        fireEvent.change(input, { target: { value: "nope" } });
        fireEvent.click(screen.getByText("Check"));
      }
      expect(screen.getByTestId("reveal")).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(5100);
      expect(screen.queryByTestId("reveal")).not.toBeInTheDocument();
      expect(screen.getByTestId("answer-input")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("persists the session when it ends", async () => {
    await startClassic();
    vi.useFakeTimers();
    try {
      // Stub pack has 8 words; classic asks for 15 → topped up to 8.
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByText(/Skip/));
      }
      const state = useProfileStore.getState();
      expect(state.globalCounts.skipped).toBe(8);
      expect(state.globalCounts.sessionsCompleted).toBe(1);
      expect(state.history).toHaveLength(8);
      expect(screen.getByText("Session summary")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("awards first-try XP including combo growth", async () => {
    await startClassic();
    // Answer three questions correctly on the first try, waiting for the
    // display to advance between answers.
    for (let i = 0; i < 3; i++) {
      const before = screen.getByTestId("phonetic-display").textContent;
      await answerCorrectly();
      await waitFor(() => {
        expect(useProfileStore.getState().history).toHaveLength(i + 1);
        expect(screen.getByTestId("phonetic-display").textContent).not.toBe(before);
      });
    }
    const state = useProfileStore.getState();
    // XP per first-try correct: 10 base + 10 first-try bonus + combo*2
    // (combo 1→22, 2→24, 3→26; combo bonus caps at +10 for streaks ≥5).
    const xp = state.history.reduce((acc, r) => acc + r.xpEarned, 0);
    expect(xp).toBe(22 + 24 + 26);
    expect(state.xpTotal).toBe(xp);
  });
});
