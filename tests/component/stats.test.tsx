import { describe, expect, it, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import StatsDashboard from "@/components/stats/StatsDashboard";
import { createEmptyProfile, useProfileStore } from "@/lib/storage/profile";
import { renderWithI18n, resetProfileStore } from "../helpers";
import { dateKey } from "@/lib/game/rng";

describe("StatsDashboard", () => {
  beforeEach(() => {
    resetProfileStore();
  });

  it("shows the empty state before any play", async () => {
    renderWithI18n(<StatsDashboard />);
    expect(await screen.findByText("Play your first session to see stats here.")).toBeInTheDocument();
  });

  it("renders win rates, level and per-language tables", async () => {
    const state = createEmptyProfile();
    state.xpTotal = 300; // level 3 (50+100+…): levelForXp(300) → 150→L3, 150 into L3? levels: L2@50, L3@150, L4@300 → level 4 exactly? xpForLevel4 = 25*4*3=300 → level 4
    state.globalCounts.correctFirst = 6;
    state.globalCounts.correctSecond = 3;
    state.globalCounts.correctThird = 1;
    state.languageStats.en.correctFirst = 10;
    state.bestSpeedScore.en = 240;
    useProfileStore.setState(state);

    renderWithI18n(<StatsDashboard />);
    await screen.findByText("Win rates");
    expect(screen.getByTestId("win-rates").textContent).toContain("60"); // 1st-attempt 60%
    expect(screen.getByTestId("win-rates").textContent).toContain("30%"); // accuracy 100%? no — accuracy = 100%
    expect(screen.getByTestId("per-language").textContent).toContain("240");
    // Level header
    expect(screen.getByText(/Level/)).toBeInTheDocument();
  });

  it("marks unlocked achievements and keeps locked ones dimmed", async () => {
    const state = createEmptyProfile();
    state.achievements = { "first-word": new Date().toISOString() };
    useProfileStore.setState(state);

    renderWithI18n(<StatsDashboard />);
    await screen.findByText("Achievements");
    expect(screen.getByTestId("achievement-first-word")).not.toHaveClass("locked");
    expect(screen.getByTestId("achievement-combo-5")).toHaveClass("locked");
    expect(screen.getByText("1 of 16")).toBeInTheDocument();
  });

  it("marks today's daily completion on the calendar", async () => {
    const state = createEmptyProfile();
    const today = dateKey(new Date());
    state.dailyCalendar[today] = { accuracyPct: 90, xpEarned: 100 };
    useProfileStore.setState(state);

    renderWithI18n(<StatsDashboard />);
    await screen.findByTestId("daily-calendar");
    const todayCell = screen
      .getByTestId("daily-calendar")
      .querySelector(".calendar-day.today.done");
    expect(todayCell).not.toBeNull();
  });

  it("renders history with Wiktionary links preserving outcome colors", async () => {
    const state = createEmptyProfile();
    state.history = [
      {
        word: "cat",
        ipa: "kæt",
        xsampa: "k{t",
        tier: "starter",
        mode: "classic",
        outcome: "correct-first",
        attemptsUsed: 1,
        hintsUsed: 0,
        xpEarned: 22,
        answeredAt: 1,
      },
      {
        word: "dog",
        ipa: "dɒɡ",
        xsampa: "dQg",
        tier: "starter",
        mode: "classic",
        outcome: "failed",
        attemptsUsed: 3,
        hintsUsed: 0,
        xpEarned: 0,
        answeredAt: 2,
      },
    ];
    useProfileStore.setState(state);

    renderWithI18n(<StatsDashboard />);
    await screen.findByTestId("history");
    const links = screen.getByTestId("history").querySelectorAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://en.wiktionary.org/wiki/cat");
    expect(links[0].className).toContain("text-bg-primary");
    expect(links[1].className).toContain("text-bg-secondary");
  });

  it("resets progress after confirmation", async () => {
    const state = createEmptyProfile();
    state.xpTotal = 500;
    state.globalCounts.correctFirst = 9;
    useProfileStore.setState(state);

    renderWithI18n(<StatsDashboard />);
    // The danger-zone button opens the confirm modal; the modal's confirm
    // button carries the same label — pick it within the dialog.
    fireEvent.click(await screen.findByRole("button", { name: "Reset all progress" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reset all progress" }));
    await waitFor(() => {
      expect(useProfileStore.getState().xpTotal).toBe(0);
      expect(useProfileStore.getState().globalCounts.correctFirst).toBe(0);
    });
  });
});
