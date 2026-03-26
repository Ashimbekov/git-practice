export type Rank = "Intern" | "Junior" | "Middle" | "Senior" | "Lead" | "Architect";

export interface QuizScore {
  correct: number;
  total: number;
}

export interface PlayerData {
  rank: Rank;
  totalXp: number;
  completedLevels: string[];
  quizScores: Record<string, QuizScore>;
  badges: string[];
  levelStartTimes: Record<string, number>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (player: PlayerData) => boolean;
}

export const RANK_THRESHOLDS: Record<Rank, number> = {
  Intern: 0,
  Junior: 500,
  Middle: 1500,
  Senior: 3500,
  Lead: 6000,
  Architect: 10000,
};
