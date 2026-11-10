/**
 * Web Speech API wrapper for the Listen & Spell mode and post-reveal
 * pronunciation.
 *
 * Browser support varies (especially for hi/zh voices), so everything is
 * feature-detected and fails silent-soft: callers render a "not available"
 * notice instead of relying on speech.
 */

export interface SpeechCapability {
  supported: boolean;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Speak a word in the given BCP-47 locale. Prefers a voice whose lang prefix
 * matches; falls back to the browser default voice (which may pronounce with
 * an unexpected accent, but never throws).
 */
export function speak(word: string, locale: string, rate = 0.9): void {
  if (!isSpeechSupported() || word.length === 0) {
    return;
  }
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = locale;
    utterance.rate = rate;
    const voice = synth
      .getVoices()
      .find((v) => v.lang.toLowerCase() === locale.toLowerCase())
      ?? synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()));
    if (voice) {
      utterance.voice = voice;
    }
    synth.speak(utterance);
  } catch {
    // Speech is a bonus, never a requirement.
  }
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
