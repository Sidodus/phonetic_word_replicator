/**
 * TTS voice pre-flight: which game languages actually have a speech voice in
 * this browser. Voices load asynchronously (and can change), so consumers
 * subscribe and re-check on the `voiceschanged` event.
 */

export interface VoiceInfo {
  lang: string;
}

function synth(): SpeechSynthesis | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return undefined;
  }
  return window.speechSynthesis;
}

/** Current voices, empty when unsupported (e.g. jsdom tests). */
export function getCurrentVoices(): VoiceInfo[] {
  try {
    return (synth()?.getVoices() ?? []) as VoiceInfo[];
  } catch {
    return [];
  }
}

/** True when any installed voice speaks the locale's language (base match). */
export function ttsSupportForLocale(locale: string, voices: readonly VoiceInfo[]): boolean {
  const base = locale.slice(0, 2).toLowerCase();
  return voices.some((voice) => voice.lang.toLowerCase().startsWith(base));
}

/**
 * Subscribe to voice availability. Fires immediately with the current list and
 * again whenever the browser reports changes. Returns an unsubscribe fn.
 */
export function subscribeToVoices(
  callback: (voices: VoiceInfo[]) => void,
): () => void {
  const speech = synth();
  if (!speech) {
    callback([]);
    return () => undefined;
  }
  const handler = () => callback(getCurrentVoices());
  handler();
  speech.addEventListener("voiceschanged", handler);
  return () => speech.removeEventListener("voiceschanged", handler);
}
