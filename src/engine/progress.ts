import { PlayerData, Rank, RANK_THRESHOLDS } from "@/types";

export function calculateRank(xp: number): Rank {
  const ranks: Rank[] = ["Architect", "Lead", "Senior", "Middle", "Junior", "Intern"];
  for (const rank of ranks) {
    if (xp >= RANK_THRESHOLDS[rank]) return rank;
  }
  return "Intern";
}

export function completeLevel(
  player: PlayerData,
  levelId: string,
  xp: number
): PlayerData {
  if (player.completedLevels.includes(levelId)) return player;

  const totalXp = player.totalXp + xp;
  return {
    ...player,
    totalXp,
    completedLevels: [...player.completedLevels, levelId],
    rank: calculateRank(totalXp),
  };
}

export function addQuizScore(
  player: PlayerData,
  levelId: string,
  correct: number,
  total: number
): PlayerData {
  const isPerfect = correct === total;
  const bonusXp = isPerfect ? 50 : 0;
  const totalXp = player.totalXp + bonusXp;

  return {
    ...player,
    totalXp,
    quizScores: {
      ...player.quizScores,
      [levelId]: { correct, total },
    },
    rank: calculateRank(totalXp),
  };
}
