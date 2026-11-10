import { expect, test } from "@playwright/test";

/**
 * End-to-end smoke: the critical user paths on the built static export.
 * Answer correctness is engine-tested; here we verify the app wires up,
 * loads real dictionary packs, and reacts to input.
 */

test("home renders hero, modes and languages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Know your phonetic sound",
  );
  await expect(page.getByText(/Classic Spelling/)).toBeVisible();
  await expect(page.getByText(/Speed Challenge/)).toBeVisible();
  // All 8 game-language buttons (English appears in nav too — assert ≥8 flags).
  await expect(page.locator(".lang-flag-btn")).toHaveCount(8);
});

test("classic play flow: question loads, input reacts, hint works", async ({ page }) => {
  await page.goto("/play?mode=classic&lang=en");
  const display = page.getByTestId("phonetic-display");
  await expect(display).toBeVisible({ timeout: 15_000 });
  const firstWord = await display.textContent();
  expect(firstWord?.length).toBeGreaterThan(0);

  // Empty submission is rejected inline.
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByTestId("input-error")).toContainText("Type an answer first");

  // A wrong answer consumes the first attempt dot.
  await page.getByTestId("answer-input").fill("zzzz");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".attempt-dot.used-1")).toHaveCount(1);

  // The hint reveals a mask.
  await page.getByRole("button", { name: /Hint/ }).click();
  await expect(page.getByTestId("hint-mask")).toBeVisible();

  // The right rail lists attempted words.
  await expect(page.getByTestId("session-rail").locator("a.badge")).toHaveCount(0);
});

test("stats page renders with empty state", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByText(/Play your first session to see stats here/)).toBeVisible({
    timeout: 10_000,
  });
});

test("settings modal opens and toggles phonetic standard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Settings/ }).click();
  await expect(page.getByText("Phonetic standard")).toBeVisible();
  await page.getByText("X-SAMPA —").click();
  // The hero sample switches to the X-SAMPA rendering of "dictionary".
  await expect(page.locator(".text-gold.fs-5")).toHaveText('/"dIkS(@)n(@)r\\I/');
});
