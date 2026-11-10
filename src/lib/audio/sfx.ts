/**
 * Sound effects synthesized with the Web Audio API — no audio assets, no
 * licensing concerns (v1 shipped two proprietary notification MP3s).
 *
 * The AudioContext is created lazily on first playback (autoplay policy) and
 * every call is guarded: sound is a bonus, never a crash.
 */

export type SfxName =
  | "correct"
  | "correct-streak"
  | "wrong"
  | "reveal"
  | "levelup"
  | "tick"
  | "timeup";

interface Tone {
  freq: number;
  /** Relative start time in seconds. */
  start: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const RECIPES: Record<SfxName, Tone[]> = {
  correct: [
    { freq: 523.25, start: 0, duration: 0.09, type: "sine", gain: 0.12 }, // C5
    { freq: 659.25, start: 0.08, duration: 0.09, type: "sine", gain: 0.12 }, // E5
    { freq: 783.99, start: 0.16, duration: 0.16, type: "sine", gain: 0.12 }, // G5
  ],
  "correct-streak": [
    { freq: 659.25, start: 0, duration: 0.08, type: "triangle", gain: 0.12 },
    { freq: 830.61, start: 0.07, duration: 0.08, type: "triangle", gain: 0.12 },
    { freq: 987.77, start: 0.14, duration: 0.08, type: "triangle", gain: 0.12 },
    { freq: 1318.51, start: 0.21, duration: 0.2, type: "triangle", gain: 0.14 },
  ],
  wrong: [
    { freq: 196, start: 0, duration: 0.18, type: "sawtooth", gain: 0.06 }, // G3
    { freq: 155.56, start: 0.14, duration: 0.24, type: "sawtooth", gain: 0.06 }, // Eb3
  ],
  reveal: [
    { freq: 392, start: 0, duration: 0.12, type: "sine", gain: 0.1 }, // G4
  ],
  levelup: [
    { freq: 523.25, start: 0, duration: 0.1, type: "triangle", gain: 0.12 },
    { freq: 659.25, start: 0.09, duration: 0.1, type: "triangle", gain: 0.12 },
    { freq: 783.99, start: 0.18, duration: 0.1, type: "triangle", gain: 0.12 },
    { freq: 1046.5, start: 0.27, duration: 0.28, type: "triangle", gain: 0.14 },
  ],
  tick: [{ freq: 880, start: 0, duration: 0.04, type: "square", gain: 0.03 }],
  timeup: [
    { freq: 440, start: 0, duration: 0.14, type: "square", gain: 0.06 },
    { freq: 329.63, start: 0.12, duration: 0.22, type: "square", gain: 0.06 },
  ],
};

export interface SfxPlayer {
  play: (name: SfxName) => void;
}

export function createSfxPlayer(isEnabled: () => boolean): SfxPlayer {
  let ctx: AudioContext | null = null;

  function ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) {
      try {
        ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }
    return ctx;
  }

  return {
    play(name: SfxName) {
      if (!isEnabled()) return;
      const audio = ensureContext();
      if (!audio) return;
      const now = audio.currentTime;
      for (const tone of RECIPES[name]) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = tone.type;
        osc.frequency.value = tone.freq;
        const t0 = now + tone.start;
        gain.gain.setValueAtTime(tone.gain, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.duration);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(t0);
        osc.stop(t0 + tone.duration + 0.02);
      }
    },
  };
}
