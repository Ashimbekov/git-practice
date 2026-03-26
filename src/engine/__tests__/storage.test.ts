import { GameStorage } from "../storage";
import { PlayerData } from "@/types";

const STORAGE_KEY = "gitquest-player";

beforeEach(() => {
  localStorage.clear();
});

describe("GameStorage", () => {
  test("load returns default player when storage is empty", () => {
    const player = GameStorage.load();
    expect(player.totalXp).toBe(0);
    expect(player.rank).toBe("Intern");
    expect(player.completedLevels).toEqual([]);
    expect(player.badges).toEqual([]);
  });

  test("save persists player data to localStorage", () => {
    const player: PlayerData = {
      rank: "Junior",
      totalXp: 850,
      completedLevels: ["01-init"],
      quizScores: { "01-init": { correct: 3, total: 3 } },
      badges: ["first-commit"],
      levelStartTimes: {},
    };
    GameStorage.save(player);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(player);
  });

  test("load returns saved player data", () => {
    const player: PlayerData = {
      rank: "Junior",
      totalXp: 850,
      completedLevels: ["01-init"],
      quizScores: {},
      badges: [],
      levelStartTimes: {},
    };
    GameStorage.save(player);
    const loaded = GameStorage.load();
    expect(loaded).toEqual(player);
  });

  test("reset clears player data", () => {
    GameStorage.save({
      rank: "Senior",
      totalXp: 5000,
      completedLevels: ["01-init"],
      quizScores: {},
      badges: [],
      levelStartTimes: {},
    });
    GameStorage.reset();
    const player = GameStorage.load();
    expect(player.totalXp).toBe(0);
  });
});
