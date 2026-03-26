import { completeLevel, addQuizScore, calculateRank } from "../progress";
import { PlayerData } from "@/types";

const emptyPlayer: PlayerData = {
  rank: "Intern",
  totalXp: 0,
  completedLevels: [],
  quizScores: {},
  badges: [],
  levelStartTimes: {},
};

describe("completeLevel", () => {
  test("adds XP and marks level as completed", () => {
    const updated = completeLevel(emptyPlayer, "01-init", 100);
    expect(updated.totalXp).toBe(100);
    expect(updated.completedLevels).toContain("01-init");
  });

  test("does not add XP twice for same level", () => {
    const first = completeLevel(emptyPlayer, "01-init", 100);
    const second = completeLevel(first, "01-init", 100);
    expect(second.totalXp).toBe(100);
  });

  test("updates rank when threshold crossed", () => {
    const player = { ...emptyPlayer, totalXp: 450 };
    const updated = completeLevel(player, "05-log", 100);
    expect(updated.rank).toBe("Junior");
  });
});

describe("addQuizScore", () => {
  test("records quiz score and adds bonus XP for perfect score", () => {
    const updated = addQuizScore(emptyPlayer, "01-init", 3, 3);
    expect(updated.quizScores["01-init"]).toEqual({ correct: 3, total: 3 });
    expect(updated.totalXp).toBe(50);
  });

  test("no bonus XP for imperfect score", () => {
    const updated = addQuizScore(emptyPlayer, "01-init", 2, 3);
    expect(updated.totalXp).toBe(0);
  });
});

describe("calculateRank", () => {
  test("returns Intern for 0 XP", () => {
    expect(calculateRank(0)).toBe("Intern");
  });

  test("returns Junior for 500 XP", () => {
    expect(calculateRank(500)).toBe("Junior");
  });

  test("returns Architect for 10000 XP", () => {
    expect(calculateRank(10000)).toBe("Architect");
  });
});
