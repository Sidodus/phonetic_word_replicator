import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// React Testing Library cleanup between tests.
afterEach(() => {
  cleanup();
});

// jsdom lacks matchMedia, which react-bootstrap's responsive helpers consult.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Deterministic fake timers opt-in per test file; default: real timers.
// Files that need frozen time call vi.useFakeTimers() themselves.
