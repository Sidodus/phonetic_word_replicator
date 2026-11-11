import { describe, expect, it, vi } from "vitest";
import {
  getCurrentVoices,
  subscribeToVoices,
  ttsSupportForLocale,
} from "@/lib/speech/voices";

describe("ttsSupportForLocale", () => {
  const voices = [
    { lang: "en-US" },
    { lang: "fr-FR" },
    { lang: "zh_CN" },
    { lang: "hi-IN" },
  ];

  it("matches by language base, case/format-insensitive", () => {
    expect(ttsSupportForLocale("en-US", voices)).toBe(true);
    expect(ttsSupportForLocale("fr-FR", voices)).toBe(true);
    expect(ttsSupportForLocale("zh-CN", voices)).toBe(true); // zh_CN matches base zh
    expect(ttsSupportForLocale("hi-IN", voices)).toBe(true);
  });

  it("reports false for languages without voices", () => {
    expect(ttsSupportForLocale("de-DE", voices)).toBe(false);
    expect(ttsSupportForLocale("es-ES", voices)).toBe(false);
    expect(ttsSupportForLocale("nl-NL", voices)).toBe(false);
    expect(ttsSupportForLocale("it-IT", voices)).toBe(false);
    expect(ttsSupportForLocale("yo-NG", voices)).toBe(false);
  });

  it("handles empty voice lists", () => {
    expect(ttsSupportForLocale("en-US", [])).toBe(false);
  });
});

describe("jsdom speech surface", () => {
  it("returns an empty voice list and a safe unsubscribe when unsupported", () => {
    // jsdom has no speechSynthesis — the module must fail soft.
    expect(getCurrentVoices()).toEqual([]);
    const unsub = subscribeToVoices((voices) => {
      expect(Array.isArray(voices)).toBe(true);
    });
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("fires immediately and on voiceschanged when speechSynthesis exists", () => {
    const listeners: (() => void)[] = [];
    const fakeSynth = {
      getVoices: vi.fn().mockReturnValue([{ lang: "en-US" }]),
      addEventListener: vi.fn((_evt, cb) => listeners.push(cb)),
      removeEventListener: vi.fn((_evt, cb) => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      }),
    };
    vi.stubGlobal("speechSynthesis", fakeSynth);
    try {
      const received: number[] = [];
      const unsub = subscribeToVoices((voices) => received.push(voices.length));
      expect(received).toEqual([1]);
      fakeSynth.getVoices.mockReturnValue([{ lang: "en-US" }, { lang: "de-DE" }]);
      listeners[0]();
      expect(received).toEqual([1, 2]);
      unsub();
      expect(listeners).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
