/**
 * Pinyin-tolerant answer matching for Chinese (opt-in setting).
 *
 * Native spelling is never affected: when `settings.pinyinTolerant` is on and
 * the game language is zh, a typed pinyin ("ma", "ma3", "mǎ") is accepted as
 * equivalent to the target word (馬/马). The comparison converts BOTH sides
 * through pinyin-pro (tone-less, letters only), so it works whether the player
 * types characters or syllables. The heavy pinyin data is dynamically imported
 * so it never lands in the main bundle.
 */

export type EquivalenceFn = (answer: string, target: string) => boolean;

/** Load pinyin-pro lazily and build the equivalence checker. */
export async function createPinyinEquivalence(): Promise<EquivalenceFn> {
  const { pinyin } = await import("pinyin-pro");
  const plain = (value: string): string =>
    pinyin(value, { toneType: "none", type: "array", nonZh: "consecutive" })
      .join("")
      // Tone marks typed by the player (mǎ) survive pinyin() on non-hanzi
      // input — strip them, plus digits (ma3) and everything non-letter.
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  return (answer, target) => {
    const answerPlain = plain(answer);
    const targetPlain = plain(target);
    return targetPlain.length > 0 && answerPlain === targetPlain;
  };
}
