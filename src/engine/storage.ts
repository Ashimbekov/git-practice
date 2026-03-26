import { PlayerData } from "@/types";

const STORAGE_KEY = "gitquest-player";

const DEFAULT_PLAYER: PlayerData = {
  rank: "Intern",
  totalXp: 0,
  completedLevels: [],
  quizScores: {},
  badges: [],
  levelStartTimes: {},
};

export const GameStorage = {
  load(): PlayerData {
    if (typeof window === "undefined") return { ...DEFAULT_PLAYER };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER };
    return JSON.parse(raw) as PlayerData;
  },

  save(player: PlayerData): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  },

  reset(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
