/**
 * Player profile: settings, XP, per-language stats, history, achievements,
 * streaks — persisted to localStorage under a single namespaced key.
 *
 * The store is the ONLY writer of profile state; all mutations flow through
 * actions so invariants (caps, monotonic counters, single unlocks) hold no
 * matter what the UI does.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  GAME_LANGUAGES,
  type AttemptOutcome,
  type AttemptRecord,
  type GameMode,
  type LanguageCode,
  type PhoneticStandard,
} from "@/types/game";
import type { AchievementSnapshot } from "@/lib/game/achievements";
import { evaluateAchievements } from "@/lib/game/achievements";
import { computeOutcomeStats } from "@/lib/game/scoring";
import { applyDailyCompletion } from "@/lib/game/streaks";
import type { SessionSummary } from "@/types/game";
import { importV1Storage } from "./v1-migration";

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

export interface Settings {
  standard: PhoneticStandard;
  /** Lenient matching (café == cafe). Reward-neutral; strict is opt-in. */
  accentInsensitive: boolean;
  soundEnabled: boolean;
  /** Pronounce the word after it is revealed. */
  autoPronounce: boolean;
  /** "auto" follows the browser language. */
  uiLocale: string;
}

export interface LanguageStats {
  correctFirst: number;
  correctSecond: number;
  correctThird: number;
  wrong: number;
  skipped: number;
  sessionsCompleted: number;
  xpEarned: number;
  bestCombo: number;
  hintsUsed: number;
}

export interface DailyCalendarEntry {
  accuracyPct: number;
  xpEarned: number;
}

export interface ProfileData {
  version: 2;
  settings: Settings;
  xpTotal: number;
  xpByLanguage: Record<LanguageCode, number>;
  globalCounts: {
    correctFirst: number;
    correctSecond: number;
    correctThird: number;
    wrong: number;
    skipped: number;
    sessionsCompleted: number;
    hintsUsed: number;
    bestCombo: number;
    perfectSessions: number;
    listenRoundsCompleted: number;
  };
  languageStats: Record<LanguageCode, LanguageStats>;
  languagesPlayed: LanguageCode[];
  /** Newest first, capped at HISTORY_CAP records. */
  history: AttemptRecord[];
  /** achievementId → ISO unlock date. */
  achievements: Record<string, string>;
  streak: { current: number; longest: number; lastDateKey: string | null };
  /** dateKey → daily challenge result; capped at CALENDAR_CAP entries. */
  dailyCalendar: Record<string, DailyCalendarEntry>;
  bestSpeedScore: Partial<Record<LanguageCode, number>>;
  lastPlayed: { language: LanguageCode; mode: GameMode } | null;
  /** Set after a successful v1 localStorage import; prevents re-import. */
  v1ImportedAt: string | null;
}

export const HISTORY_CAP = 300;
export const CALENDAR_CAP = 120;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export const DEFAULT_SETTINGS: Settings = {
  standard: "IPA",
  accentInsensitive: true,
  soundEnabled: true,
  autoPronounce: true,
  uiLocale: "auto",
};

export function emptyLanguageStats(): LanguageStats {
  return {
    correctFirst: 0,
    correctSecond: 0,
    correctThird: 0,
    wrong: 0,
    skipped: 0,
    sessionsCompleted: 0,
    xpEarned: 0,
    bestCombo: 0,
    hintsUsed: 0,
  };
}

export function createEmptyProfile(): ProfileData {
  const languageStats = {} as Record<LanguageCode, LanguageStats>;
  const xpByLanguage = {} as Record<LanguageCode, number>;
  for (const lang of GAME_LANGUAGES) {
    languageStats[lang] = emptyLanguageStats();
    xpByLanguage[lang] = 0;
  }
  return {
    version: 2,
    settings: { ...DEFAULT_SETTINGS },
    xpTotal: 0,
    xpByLanguage,
    globalCounts: {
      correctFirst: 0,
      correctSecond: 0,
      correctThird: 0,
      wrong: 0,
      skipped: 0,
      sessionsCompleted: 0,
      hintsUsed: 0,
      bestCombo: 0,
      perfectSessions: 0,
      listenRoundsCompleted: 0,
    },
    languageStats,
    languagesPlayed: [],
    history: [],
    achievements: {},
    streak: { current: 0, longest: 0, lastDateKey: null },
    dailyCalendar: {},
    bestSpeedScore: {},
    lastPlayed: null,
    v1ImportedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

export function outcomeCountsOfStats(stats: LanguageStats) {
  return {
    correctFirst: stats.correctFirst,
    correctSecond: stats.correctSecond,
    correctThird: stats.correctThird,
    wrong: stats.wrong,
    skipped: stats.skipped,
  };
}

/** Snapshot of profile state consumed by achievement evaluation. */
export function achievementSnapshotOf(profile: ProfileData): AchievementSnapshot {
  const answered =
    profile.globalCounts.correctFirst +
    profile.globalCounts.correctSecond +
    profile.globalCounts.correctThird +
    profile.globalCounts.wrong +
    profile.globalCounts.skipped;
  return {
    xpTotal: profile.xpTotal,
    correctTotal:
      profile.globalCounts.correctFirst +
      profile.globalCounts.correctSecond +
      profile.globalCounts.correctThird,
    bestCombo: profile.globalCounts.bestCombo,
    perfectSessions: profile.globalCounts.perfectSessions,
    speedBest: Math.max(0, ...Object.values(profile.bestSpeedScore).map((v) => v ?? 0)),
    dailyStreak: profile.streak.longest,
    languagesPlayed: profile.languagesPlayed,
    listenRoundsCompleted: profile.globalCounts.listenRoundsCompleted,
    answeredTotal: answered,
    firstTryAccuracyPct:
      answered === 0
        ? 0
        : Math.round((profile.globalCounts.correctFirst / answered) * 10000) / 100,
  };
}

/** Outcome → per-language counter key. */
function bumpOutcome(stats: LanguageStats, outcome: AttemptOutcome): void {
  switch (outcome) {
    case "correct-first":
      stats.correctFirst += 1;
      break;
    case "correct-second":
      stats.correctSecond += 1;
      break;
    case "correct-third":
      stats.correctThird += 1;
      break;
    case "failed":
      stats.wrong += 1;
      break;
    case "skipped":
      stats.skipped += 1;
      break;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface ProfileActions {
  updateSettings: (patch: Partial<Settings>) => void;
  recordAttempt: (language: LanguageCode, record: AttemptRecord) => void;
  endSession: (summary: SessionSummary, todayKey?: string) => string[];
  /** Read legacy v1 localStorage keys and fold them in. Returns import summary. */
  importV1: () => { imported: boolean; languages: LanguageCode[]; historyEntries: number };
  resetProfile: () => void;
}

export type ProfileStore = ProfileData & ProfileActions;

export const PROFILE_STORAGE_KEY = "pwr.v2.profile";

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      ...createEmptyProfile(),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      recordAttempt: (language, record) =>
        set((state) => {
          const stats = { ...state.languageStats[language] };
          bumpOutcome(stats, record.outcome);
          stats.xpEarned += record.xpEarned;
          stats.hintsUsed += record.hintsUsed;

          const globalCounts = { ...state.globalCounts };
          bumpOutcome(globalCounts as unknown as LanguageStats, record.outcome);
          globalCounts.hintsUsed += record.hintsUsed;

          const languagesPlayed = state.languagesPlayed.includes(language)
            ? state.languagesPlayed
            : [...state.languagesPlayed, language];

          const history = [record, ...state.history].slice(0, HISTORY_CAP);

          return {
            globalCounts,
            languageStats: { ...state.languageStats, [language]: stats },
            languagesPlayed,
            history,
            xpTotal: state.xpTotal + record.xpEarned,
            xpByLanguage: {
              ...state.xpByLanguage,
              [language]: state.xpByLanguage[language] + record.xpEarned,
            },
          };
        }),

      endSession: (summary, todayKey) => {
        const state = get();

        const stats = { ...state.languageStats[summary.language] };
        stats.sessionsCompleted += 1;
        stats.bestCombo = Math.max(stats.bestCombo, summary.bestCombo);

        const globalCounts = { ...state.globalCounts };
        globalCounts.sessionsCompleted += 1;
        globalCounts.bestCombo = Math.max(globalCounts.bestCombo, summary.bestCombo);

        const perfectSession =
          summary.records.length >= 10 &&
          summary.records.every((r) => r.outcome === "correct-first");
        if (perfectSession) {
          globalCounts.perfectSessions += 1;
        }
        if (summary.mode === "listen") {
          globalCounts.listenRoundsCompleted += 1;
        }

        let streak = state.streak;
        const dailyCalendar = { ...state.dailyCalendar };
        if (summary.mode === "daily" && todayKey) {
          const correct = summary.records.filter(
            (r) =>
              r.outcome === "correct-first" ||
              r.outcome === "correct-second" ||
              r.outcome === "correct-third",
          ).length;
          const update = applyDailyCompletion(
            state.streak.lastDateKey,
            state.streak.current,
            todayKey,
          );
          streak = { current: update.current, longest: update.longest, lastDateKey: todayKey };
          if (update.isNewToday) {
            const accuracyPct =
              summary.records.length === 0
                ? 0
                : Math.round((correct / summary.records.length) * 100);
            dailyCalendar[todayKey] = {
              accuracyPct,
              xpEarned: summary.xpEarned,
            };
            // Keep the calendar bounded (drop oldest keys).
            const keys = Object.keys(dailyCalendar);
            if (keys.length > CALENDAR_CAP) {
              for (const key of keys.slice(0, keys.length - CALENDAR_CAP)) {
                delete dailyCalendar[key];
              }
            }
          }
        }

        const bestSpeedScore = { ...state.bestSpeedScore };
        if (summary.mode === "speed" && summary.speedScore > 0) {
          bestSpeedScore[summary.language] = Math.max(
            bestSpeedScore[summary.language] ?? 0,
            summary.speedScore,
          );
        }

        const next: ProfileData = {
          ...state,
          languageStats: { ...state.languageStats, [summary.language]: stats },
          globalCounts,
          streak,
          dailyCalendar,
          bestSpeedScore,
          lastPlayed: { language: summary.language, mode: summary.mode },
        };

        // Achievements are evaluated against the post-session snapshot.
        const before = Object.keys(state.achievements);
        const snapshot = achievementSnapshotOf(next);
        const sessionContext = {
          mode: summary.mode,
          speedScore: summary.speedScore,
          questionsInSession: summary.records.length,
          correctFirstInSession: summary.records.filter((r) => r.outcome === "correct-first")
            .length,
        };
        const unlocked = evaluateAchievements(snapshot, sessionContext).filter(
          (id) => !before.includes(id),
        );
        for (const id of unlocked) {
          next.achievements = { ...next.achievements, [id]: new Date().toISOString() };
        }

        set(next);
        return unlocked;
      },

      importV1: () => {
        const state = get();
        if (state.v1ImportedAt) {
          return { imported: false, languages: [], historyEntries: 0 };
        }
        if (typeof window === "undefined") {
          return { imported: false, languages: [], historyEntries: 0 };
        }
        const legacy = importV1Storage(window.localStorage);
        if (!legacy.hasAnyData) {
          set({ v1ImportedAt: new Date().toISOString() });
          return { imported: false, languages: [], historyEntries: 0 };
        }

        set((current) => {
          const languageStats = { ...current.languageStats };
          const xpByLanguage = { ...current.xpByLanguage };
          const languagesPlayed = new Set(current.languagesPlayed);
          const globalCounts = { ...current.globalCounts };

          for (const lang of GAME_LANGUAGES) {
            const v1 = legacy.languages[lang];
            if (!v1) continue;
            const stats = { ...languageStats[lang] };
            stats.correctFirst += v1.correctFirst;
            stats.correctSecond += v1.correctSecond;
            stats.correctThird += v1.correctThird;
            stats.wrong += v1.wrong;
            stats.hintsUsed += v1.hintsUsed;
            languageStats[lang] = stats;
            globalCounts.correctFirst += v1.correctFirst;
            globalCounts.correctSecond += v1.correctSecond;
            globalCounts.correctThird += v1.correctThird;
            globalCounts.wrong += v1.wrong;
            globalCounts.hintsUsed += v1.hintsUsed;
            if (v1.correctFirst + v1.correctSecond + v1.correctThird + v1.wrong > 0) {
              languagesPlayed.add(lang);
            }
          }

          const history =
            current.history.length === 0 ? legacy.history.slice(0, HISTORY_CAP) : current.history;

          return {
            languageStats,
            xpByLanguage,
            globalCounts,
            languagesPlayed: [...languagesPlayed],
            history,
            v1ImportedAt: new Date().toISOString(),
          };
        });
        return {
          imported: true,
          languages: Object.keys(legacy.languages) as LanguageCode[],
          historyEntries: legacy.history.length,
        };
      },

      resetProfile: () => {
        const settings = get().settings;
        set(() => ({
          ...createEmptyProfile(),
          // Keep UI preferences across resets; wipe progress only.
          settings,
          v1ImportedAt: new Date().toISOString(),
        }));
      },
    }),
    {
      name: PROFILE_STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // Prerender/SSR-safe no-op storage.
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
    },
  ),
);

/** Convenience selector: outcome stats for a language (NaN-safe). */
export function selectLanguageOutcomeStats(
  profile: ProfileData,
  language: LanguageCode,
): ReturnType<typeof computeOutcomeStats> {
  return computeOutcomeStats(outcomeCountsOfStats(profile.languageStats[language]));
}

/** Convenience selector: global outcome stats. */
export function selectGlobalOutcomeStats(profile: ProfileData): ReturnType<typeof computeOutcomeStats> {
  return computeOutcomeStats(profile.globalCounts);
}
