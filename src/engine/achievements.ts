import { Badge, PlayerData } from "@/types";

export const BADGES: Badge[] = [
  {
    id: "first-commit",
    name: "Первый коммит",
    description: "Пройти первый уровень",
    icon: "🎯",
    condition: (p) => p.completedLevels.length >= 1,
  },
  {
    id: "branching-master",
    name: "Ветвление мастер",
    description: "Пройти все уровни по веткам",
    icon: "🌿",
    condition: (p) =>
      ["04-branch", "05-switch", "06-merge", "07-rebase", "08-head"].every((id) =>
        p.completedLevels.includes(id)
      ),
  },
  {
    id: "conflict-resolved",
    name: "Конфликт решён",
    description: "Пройти уровень по merge conflicts",
    icon: "⚔️",
    condition: (p) => p.completedLevels.includes("22-merge-conflicts"),
  },
  {
    id: "git-archaeologist",
    name: "Git археолог",
    description: "Пройти все уровни Git internals",
    icon: "🏛️",
    condition: (p) =>
      ["28-objects", "29-blobs-trees", "30-refs-head"].every((id) =>
        p.completedLevels.includes(id)
      ),
  },
  {
    id: "speedrun",
    name: "Speedrun",
    description: "Пройти уровень меньше чем за 2 минуты",
    icon: "⚡",
    condition: (p) => {
      return Object.entries(p.levelStartTimes).some(([levelId, startTime]) => {
        if (!p.completedLevels.includes(levelId)) return false;
        return Date.now() - startTime < 120_000;
      });
    },
  },
  {
    id: "perfectionist",
    name: "Перфекционист",
    description: "Все квизы без ошибок в разделе",
    icon: "💯",
    condition: (p) => {
      const scores = Object.values(p.quizScores);
      return scores.length >= 5 && scores.every((s) => s.correct === s.total);
    },
  },
];

export function checkNewBadges(player: PlayerData): string[] {
  return BADGES.filter(
    (badge) => !player.badges.includes(badge.id) && badge.condition(player)
  ).map((b) => b.id);
}
