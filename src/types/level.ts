export type Section =
  | "basics"
  | "branching"
  | "remote"
  | "github"
  | "advanced"
  | "teamwork"
  | "internals";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface LevelMeta {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xp: number;
  section: Section;
  tags: string[];
  prerequisites: string[];
  estimatedMinutes: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChallengeTask {
  title: string;
  description: string;
  hint: string;
  verificationSteps: string[];
}
