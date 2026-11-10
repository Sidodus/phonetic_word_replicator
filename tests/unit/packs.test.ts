import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validatePack } from "@/lib/game/dictionary";
import { GAME_LANGUAGES } from "@/types/game";

const PACKS_DIR = path.resolve(__dirname, "../../public/dictionaries");

/**
 * Contract test for the SHIPPED packs: whatever the pipeline produced must
 * satisfy the runtime validator the game uses. A failing test here means the
 * data pipeline and the engine have drifted apart.
 */
describe("shipped dictionary packs", () => {
  it("contains a pack for all 8 game languages plus the index", () => {
    for (const lang of GAME_LANGUAGES) {
      expect(fs.existsSync(path.join(PACKS_DIR, `${lang}.json`)), `missing ${lang}.json`).toBe(
        true,
      );
    }
    expect(fs.existsSync(path.join(PACKS_DIR, "index.json"))).toBe(true);
  });

  for (const lang of GAME_LANGUAGES) {
    describe(lang, () => {
      const raw = fs.readFileSync(path.join(PACKS_DIR, `${lang}.json`), "utf8");
      const data: unknown = JSON.parse(raw);

      it("passes the runtime validator", () => {
        expect(() => validatePack(data)).not.toThrow();
      });

      const pack = validatePack(data);

      it("has a usable size (>= 300 entries)", () => {
        expect(pack.meta.count).toBeGreaterThanOrEqual(300);
      });

      it("matches its declared language and metadata", () => {
        expect(pack.meta.lang).toBe(lang);
        expect(pack.meta.version).toBe(2);
        expect(pack.meta.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it("is within the deployed size budget (<= 400KB raw)", () => {
        expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(400 * 1024);
      });

      it("every pronunciation is non-empty after wrapper stripping", () => {
        for (const entry of pack.entries.slice(0, 200)) {
          expect(entry.ipa.length).toBeGreaterThan(0);
          expect(entry.xs.length).toBeGreaterThan(0);
          expect(entry.ipa.startsWith("/")).toBe(false);
          expect(entry.ipa.startsWith("[")).toBe(false);
        }
      });

      it("words respect the curation shape rules", () => {
        const letters = pack.entries.slice(0, 300);
        for (const entry of letters) {
          expect(entry.w).not.toMatch(/\s|\d/);
          expect(Array.from(entry.w).length).toBeLessThanOrEqual(12);
        }
      });
    });
  }

  it("index.json counts match the actual packs", () => {
    const index = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, "index.json"), "utf8")) as {
      languages: Record<string, { count: number; bytes: number; file: string }>;
    };
    for (const lang of GAME_LANGUAGES) {
      const packRaw = fs.readFileSync(path.join(PACKS_DIR, `${lang}.json`), "utf8");
      const entry = index.languages[lang];
      expect(entry.file).toBe(`${lang}.json`);
      expect(entry.count).toBe((JSON.parse(packRaw) as { entries: unknown[] }).entries.length);
      expect(entry.bytes).toBe(Buffer.byteLength(packRaw));
    }
  });
});
