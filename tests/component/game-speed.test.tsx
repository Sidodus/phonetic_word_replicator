import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import GamePage from "@/components/game/GamePage";
import { useProfileStore } from "@/lib/storage/profile";
import { renderWithI18n, resetProfileStore, stubDictionaryFetch } from "../helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("mode=speed&lang=en"),
  usePathname: () => "/play",
}));

describe("GamePage — speed mode", () => {
  beforeEach(() => {
    resetProfileStore();
    stubDictionaryFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("counts down and ends the round at zero", async () => {
    // Fake timers must be active from the start so the countdown interval is
    // created under them.
    vi.useFakeTimers();
    try {
      renderWithI18n(<GamePage />);
      // Flush the async pack load: poll with small fake-timer advances until
      // the question renders (microtasks resolve between advances).
      for (let i = 0; i < 50; i++) {
        if (screen.queryByTestId("phonetic-display")) break;
        await act(async () => {
          await vi.advanceTimersByTimeAsync(10);
        });
      }
      expect(screen.getByTestId("phonetic-display")).toBeInTheDocument();
      // 60s round: advance past the end; act() flushes the re-renders each
      // tick chain triggers.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(61000);
      });
      expect(useProfileStore.getState().globalCounts.sessionsCompleted).toBe(1);
      expect(screen.getByText("Session summary")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("awards speed score with multipliers and shows it in the header", async () => {
    renderWithI18n(<GamePage />);
    await screen.findByTestId("phonetic-display");
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
    // Answer 3 correctly → 10 + 10 + 20 = 40.
    for (let i = 0; i < 3; i++) {
      const ipa = screen.getByTestId("phonetic-display").textContent ?? "";
      const answer = answerByIpa[ipa];
      expect(answer).toBeTruthy();
      fireEvent.change(screen.getByTestId("answer-input"), { target: { value: answer } });
      fireEvent.click(screen.getByText("Check"));
      await waitFor(() => {
        expect(screen.getByTestId("session-rail").querySelectorAll("a.badge")).toHaveLength(i + 1);
      });
    }
    expect(screen.getByText(/Score: 40/)).toBeInTheDocument();
  });

  it("advances immediately on a miss (one-shot per word)", async () => {
    renderWithI18n(<GamePage />);
    await screen.findByTestId("phonetic-display");
    const firstIpa = screen.getByTestId("phonetic-display").textContent ?? "";
    fireEvent.change(screen.getByTestId("answer-input"), { target: { value: "zzz" } });
    fireEvent.click(screen.getByText("Check"));
    await waitFor(() => {
      const nextIpa = screen.getByTestId("phonetic-display").textContent ?? "";
      expect(nextIpa).not.toBe(firstIpa);
    });
    const state = useProfileStore.getState();
    expect(state.globalCounts.wrong).toBe(1);
    expect(state.globalCounts.correctFirst).toBe(0);
  });
});
