import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import Home from "@/components/home/Home";
import { renderWithI18n, resetProfileStore } from "../helpers";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

describe("Home", () => {
  beforeEach(() => {
    resetProfileStore();
    push.mockClear();
  });

  it("renders the hero, all 5 mode cards and all 8 language buttons", async () => {
    renderWithI18n(<Home packIndex={null} />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Know your phonetic sound.",
      );
    });
    for (const mode of ["Classic Spelling", "Multiple Choice", "Listen & Spell", "Speed Challenge", "Daily Challenge", "Review"]) {
      expect(screen.getByText(new RegExp(mode))).toBeInTheDocument();
    }
    for (const endonym of ["English", "Français", "Deutsch", "Español", "Italiano", "Nederlands", "हिन्दी", "中文"]) {
      expect(screen.getByText(endonym)).toBeInTheDocument();
    }
  });

  it("starts a session with the selected mode and language", async () => {
    renderWithI18n(<Home packIndex={null} />);
    await screen.findByText(/Daily Challenge/);
    fireEvent.click(screen.getByText(/Daily Challenge/));
    fireEvent.click(screen.getByText("Deutsch"));
    fireEvent.click(screen.getByText(/Start playing/));
    expect(push).toHaveBeenCalledWith("/play?mode=daily&lang=de");
  });

  it("defaults to classic + english", async () => {
    renderWithI18n(<Home packIndex={null} />);
    await screen.findByText(/Start playing/);
    fireEvent.click(screen.getByText(/Start playing/));
    expect(push).toHaveBeenCalledWith("/play?mode=classic&lang=en");
  });

  it("shows the how-to-play rules once", async () => {
    renderWithI18n(<Home packIndex={null} />);
    expect(await screen.findByText("How it works")).toBeInTheDocument();
    // rule2's distinctive tail appears only in the how-to-play list.
    expect(screen.getAllByText(/blue for first-try, yellow for second/)).toHaveLength(1);
  });
});
