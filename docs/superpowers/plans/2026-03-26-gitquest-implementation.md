# GitQuest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive web game that teaches Git and GitHub through visualizations, quizzes, and challenges with gamification and a narrative storyline.

**Architecture:** Component-driven with file-based content. Each level is a self-contained folder with meta.json and a React component. A shared GitVisualizer engine renders animated git graphs across all levels. Game progress stored in localStorage with optional GitHub OAuth sync.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, @xyflow/react (reactflow v12), framer-motion

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `.gitignore`

- [ ] **Step 1: Create Next.js project**

Run:
```bash
cd /Users/nurdaulet/workspace/git-game
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

When prompted about overwriting, answer Yes. This creates the full Next.js scaffolding.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @xyflow/react framer-motion
```

- [ ] **Step 3: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on http://localhost:3000, default Next.js page loads.

- [ ] **Step 4: Clean up default page**

Replace `src/app/page.tsx` with:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <h1 className="text-4xl font-bold text-center pt-20">GitQuest</h1>
      <p className="text-center text-gray-400 mt-4">Изучай Git играючи</p>
    </main>
  );
}
```

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "GitQuest — Изучай Git играючи",
  description: "Интерактивная веб-игра для изучения Git и GitHub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-950 text-white;
  }
}
```

- [ ] **Step 5: Verify clean page**

Run: `npm run dev`
Expected: Page shows "GitQuest" heading and subtitle on dark background.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, reactflow, framer-motion"
```

---

### Task 2: Core Types

**Files:**
- Create: `src/types/level.ts`
- Create: `src/types/player.ts`
- Create: `src/types/git-graph.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Create level types**

Create `src/types/level.ts`:

```ts
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
```

- [ ] **Step 2: Create player types**

Create `src/types/player.ts`:

```ts
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
```

- [ ] **Step 3: Create git graph types**

Create `src/types/git-graph.ts`:

```ts
export interface GitCommitNode {
  id: string;
  message: string;
  branch: string;
  parent?: string;
  secondParent?: string;
}

export interface GitBranchRef {
  name: string;
  commitId: string;
  color: string;
}

export interface GitGraphState {
  commits: GitCommitNode[];
  branches: GitBranchRef[];
  head: string;
}

export interface GitVisualizerStep {
  command: string;
  narration: string;
  addCommits?: GitCommitNode[];
  addBranches?: GitBranchRef[];
  removeBranches?: string[];
  moveHead?: string;
  highlight?: string;
}
```

- [ ] **Step 4: Create barrel export**

Create `src/types/index.ts`:

```ts
export * from "./level";
export * from "./player";
export * from "./git-graph";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/
git commit -m "feat: add core TypeScript types for levels, player, and git graph"
```

---

### Task 3: Game Engine — Storage

**Files:**
- Create: `src/engine/storage.ts`
- Create: `src/engine/__tests__/storage.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

Create `jest.config.ts`:

```ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/"],
};

export default config;
```

- [ ] **Step 2: Write failing tests for storage**

Create `src/engine/__tests__/storage.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest src/engine/__tests__/storage.test.ts`
Expected: FAIL — `Cannot find module '../storage'`

- [ ] **Step 4: Implement storage**

Create `src/engine/storage.ts`:

```ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest src/engine/__tests__/storage.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add jest.config.ts src/engine/ package.json package-lock.json
git commit -m "feat: add GameStorage with localStorage persistence and tests"
```

---

### Task 4: Game Engine — Progress & Achievements

**Files:**
- Create: `src/engine/progress.ts`
- Create: `src/engine/achievements.ts`
- Create: `src/engine/__tests__/progress.test.ts`

- [ ] **Step 1: Write failing tests for progress**

Create `src/engine/__tests__/progress.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/engine/__tests__/progress.test.ts`
Expected: FAIL — `Cannot find module '../progress'`

- [ ] **Step 3: Implement progress**

Create `src/engine/progress.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/engine/__tests__/progress.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Implement achievements**

Create `src/engine/achievements.ts`:

```ts
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
```

- [ ] **Step 6: Commit**

```bash
git add src/engine/
git commit -m "feat: add progress system (XP, ranks) and achievements (badges)"
```

---

### Task 5: Git Visualizer Component

**Files:**
- Create: `src/components/git-visualizer/GitVisualizer.tsx`
- Create: `src/components/git-visualizer/CommitNode.tsx`
- Create: `src/components/git-visualizer/useGitGraph.ts`
- Create: `src/components/git-visualizer/index.ts`
- Create: `src/lib/git-graph.ts`

- [ ] **Step 1: Create git graph model**

Create `src/lib/git-graph.ts`:

```ts
import { GitCommitNode, GitBranchRef, GitGraphState, GitVisualizerStep } from "@/types";

const BRANCH_COLORS = [
  "#22c55e", // green — main
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

export function buildInitialState(commits: GitCommitNode[]): GitGraphState {
  const branchNames = [...new Set(commits.map((c) => c.branch))];
  const branches: GitBranchRef[] = branchNames.map((name, i) => {
    const branchCommits = commits.filter((c) => c.branch === name);
    const lastCommit = branchCommits[branchCommits.length - 1];
    return {
      name,
      commitId: lastCommit.id,
      color: BRANCH_COLORS[i % BRANCH_COLORS.length],
    };
  });

  return {
    commits,
    branches,
    head: branches[0]?.name ?? "main",
  };
}

export function applyStep(state: GitGraphState, step: GitVisualizerStep): GitGraphState {
  let { commits, branches, head } = state;

  if (step.addCommits) {
    commits = [...commits, ...step.addCommits];
  }

  if (step.addBranches) {
    branches = [...branches, ...step.addBranches];
  }

  if (step.removeBranches) {
    branches = branches.filter((b) => !step.removeBranches!.includes(b.name));
  }

  // Update branch refs to point to latest commit on that branch
  if (step.addCommits) {
    branches = branches.map((b) => {
      const latestOnBranch = [...commits]
        .reverse()
        .find((c) => c.branch === b.name);
      return latestOnBranch ? { ...b, commitId: latestOnBranch.id } : b;
    });
  }

  if (step.moveHead) {
    head = step.moveHead;
  }

  return { commits, branches, head };
}
```

- [ ] **Step 2: Create CommitNode component**

Create `src/components/git-visualizer/CommitNode.tsx`:

```tsx
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";

interface CommitNodeData {
  label: string;
  message: string;
  branchColor: string;
  isHead: boolean;
  isHighlighted: boolean;
}

function CommitNodeComponent({ data }: NodeProps) {
  const { label, message, branchColor, isHead, isHighlighted } = data as unknown as CommitNodeData;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />

      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-mono border-[3px] transition-all ${
          isHighlighted ? "ring-4 ring-offset-2 ring-offset-gray-950" : ""
        }`}
        style={{
          borderColor: branchColor,
          backgroundColor: "#1a1a2e",
          ringColor: isHighlighted ? branchColor : undefined,
        }}
      >
        {label}
      </div>

      {isHead && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -right-16 top-1/2 -translate-y-1/2 bg-rose-600/30 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full"
        >
          HEAD
        </motion.div>
      )}

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap max-w-[100px] truncate">
        {message}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    </motion.div>
  );
}

export const CommitNodeType = memo(CommitNodeComponent);
```

- [ ] **Step 3: Create useGitGraph hook**

Create `src/components/git-visualizer/useGitGraph.ts`:

```ts
"use client";

import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { GitGraphState } from "@/types";

const Y_SPACING = 100;
const X_SPACING = 160;

export function useGitGraph(state: GitGraphState) {
  return useMemo(() => {
    const branchColumns: Record<string, number> = {};
    state.branches.forEach((b, i) => {
      branchColumns[b.name] = i;
    });

    const commitIndex: Record<string, number> = {};
    state.commits.forEach((c, i) => {
      commitIndex[c.id] = i;
    });

    const nodes: Node[] = state.commits.map((commit, i) => {
      const branch = state.branches.find((b) => b.name === commit.branch);
      const col = branchColumns[commit.branch] ?? 0;

      return {
        id: commit.id,
        type: "commitNode",
        position: { x: col * X_SPACING + 80, y: i * Y_SPACING + 40 },
        data: {
          label: commit.id.slice(0, 4),
          message: commit.message,
          branchColor: branch?.color ?? "#6b7280",
          isHead:
            state.head === commit.branch &&
            branch?.commitId === commit.id,
          isHighlighted: false,
        },
        draggable: false,
      };
    });

    const edges: Edge[] = [];
    state.commits.forEach((commit) => {
      if (commit.parent) {
        const parentBranch = state.commits.find((c) => c.id === commit.parent)?.branch;
        const branch = state.branches.find((b) => b.name === commit.branch);

        edges.push({
          id: `${commit.parent}-${commit.id}`,
          source: commit.parent,
          target: commit.id,
          style: { stroke: branch?.color ?? "#6b7280", strokeWidth: 2.5 },
          type: "smoothstep",
        });
      }
      if (commit.secondParent) {
        edges.push({
          id: `${commit.secondParent}-${commit.id}`,
          source: commit.secondParent,
          target: commit.id,
          style: { stroke: "#6b7280", strokeWidth: 1.5, strokeDasharray: "6 3" },
          type: "smoothstep",
        });
      }
    });

    return { nodes, edges };
  }, [state]);
}
```

- [ ] **Step 4: Create GitVisualizer component**

Create `src/components/git-visualizer/GitVisualizer.tsx`:

```tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { GitCommitNode, GitVisualizerStep } from "@/types";
import { buildInitialState, applyStep } from "@/lib/git-graph";
import { useGitGraph } from "./useGitGraph";
import { CommitNodeType } from "./CommitNode";

interface GitVisualizerProps {
  initial: GitCommitNode[];
  steps: GitVisualizerStep[];
  currentStep: number;
}

const nodeTypes: NodeTypes = {
  commitNode: CommitNodeType,
};

export function GitVisualizer({ initial, steps, currentStep }: GitVisualizerProps) {
  const state = useMemo(() => {
    let s = buildInitialState(initial);
    for (let i = 0; i < currentStep; i++) {
      s = applyStep(s, steps[i]);
    }
    return s;
  }, [initial, steps, currentStep]);

  const { nodes, edges } = useGitGraph(state);

  const currentNarration = currentStep > 0 ? steps[currentStep - 1]?.narration : null;
  const currentCommand = currentStep > 0 ? steps[currentStep - 1]?.command : null;

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-gray-500 mb-2">Git граф</div>

      {/* Branch labels */}
      <div className="flex gap-2 mb-3">
        {state.branches.map((b) => (
          <span
            key={b.name}
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: `${b.color}20`,
              color: b.color,
              border: `1px solid ${b.color}40`,
            }}
          >
            {b.name}
            {state.head === b.name && " ← HEAD"}
          </span>
        ))}
      </div>

      {/* Graph */}
      <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden bg-black/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#333" gap={20} />
        </ReactFlow>
      </div>

      {/* Current command */}
      <AnimatePresence mode="wait">
        {currentCommand && (
          <motion.div
            key={currentCommand}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 bg-gray-900 rounded-lg px-4 py-2 font-mono text-sm text-emerald-400"
          >
            $ {currentCommand}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 5: Create barrel export**

Create `src/components/git-visualizer/index.ts`:

```ts
export { GitVisualizer } from "./GitVisualizer";
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/git-visualizer/ src/lib/git-graph.ts
git commit -m "feat: add GitVisualizer component with animated git graph rendering"
```

---

### Task 6: Terminal Simulator Component

**Files:**
- Create: `src/components/terminal-sim/TerminalSim.tsx`
- Create: `src/components/terminal-sim/index.ts`

- [ ] **Step 1: Create TerminalSim component**

Create `src/components/terminal-sim/TerminalSim.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "success" | "error";
}

interface TerminalSimProps {
  lines: TerminalLine[];
  typingSpeed?: number;
}

export function TerminalSim({ lines, typingSpeed = 30 }: TerminalSimProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (visibleLines >= lines.length) return;

    const currentLine = lines[visibleLines];

    if (currentLine.type === "command") {
      setIsTyping(true);
      let charIndex = 0;
      const interval = setInterval(() => {
        charIndex++;
        setTypedText(currentLine.text.slice(0, charIndex));
        if (charIndex >= currentLine.text.length) {
          clearInterval(interval);
          setIsTyping(false);
          setTimeout(() => setVisibleLines((v) => v + 1), 300);
        }
      }, typingSpeed);
      return () => clearInterval(interval);
    } else {
      const timeout = setTimeout(() => setVisibleLines((v) => v + 1), 200);
      return () => clearTimeout(timeout);
    }
  }, [visibleLines, lines, typingSpeed]);

  const colorMap = {
    command: "text-gray-400",
    output: "text-white",
    success: "text-emerald-400",
    error: "text-red-400",
  };

  return (
    <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-sm overflow-hidden">
      <div className="flex gap-1.5 mb-3">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
      </div>

      <div className="space-y-1">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={colorMap[line.type]}
          >
            {line.type === "command" ? `$ ${line.text}` : line.text}
          </motion.div>
        ))}

        {isTyping && visibleLines < lines.length && lines[visibleLines].type === "command" && (
          <div className="text-gray-400">
            $ {typedText}
            <span className="animate-pulse">▊</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create barrel export**

Create `src/components/terminal-sim/index.ts`:

```ts
export { TerminalSim } from "./TerminalSim";
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/terminal-sim/
git commit -m "feat: add TerminalSim component with typing animation"
```

---

### Task 7: Quiz Component

**Files:**
- Create: `src/components/quiz/Quiz.tsx`
- Create: `src/components/quiz/index.ts`

- [ ] **Step 1: Create Quiz component**

Create `src/components/quiz/Quiz.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QuizQuestion } from "@/types";

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (correct: number, total: number) => void;
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const question = questions[currentIndex];
  const isCorrect = selectedAnswer === question.correctIndex;
  const isLast = currentIndex === questions.length - 1;

  function handleSelect(optionIndex: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIndex);
    if (optionIndex === question.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    if (isLast) {
      const finalCorrect = correctCount;
      setShowResult(true);
      onComplete(finalCorrect, questions.length);
    } else {
      setSelectedAnswer(null);
      setCurrentIndex((i) => i + 1);
    }
  }

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
      >
        <h3 className="text-xl font-bold mb-2">Результат квиза</h3>
        <p className="text-gray-300">
          {correctCount} из {questions.length} правильно
        </p>
        {correctCount === questions.length && (
          <p className="text-emerald-400 mt-2 font-medium">
            Идеально! +50 бонусного XP
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Вопрос {currentIndex + 1} из {questions.length}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-5">{question.question}</h3>

      <div className="space-y-3">
        {question.options.map((option, i) => {
          let className =
            "w-full text-left px-4 py-3 rounded-lg border transition-all ";

          if (selectedAnswer === null) {
            className += "border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10 cursor-pointer";
          } else if (i === question.correctIndex) {
            className += "border-emerald-500 bg-emerald-500/10";
          } else if (i === selectedAnswer) {
            className += "border-red-500 bg-red-500/10 opacity-60";
          } else {
            className += "border-gray-700 opacity-40";
          }

          return (
            <motion.button
              key={i}
              whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
              onClick={() => handleSelect(i)}
              className={className}
            >
              <span className="text-gray-500 mr-3 font-mono">
                {String.fromCharCode(65 + i)})
              </span>
              {option}
              {selectedAnswer !== null && i === question.correctIndex && (
                <span className="ml-2">✅</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedAnswer !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-4 rounded-lg border ${
            isCorrect
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <p className={`font-medium ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
            {isCorrect ? "Верно!" : "Неверно"}
          </p>
          <p className="text-sm text-gray-300 mt-1">{question.explanation}</p>

          <button
            onClick={handleNext}
            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            {isLast ? "Завершить квиз" : "Следующий вопрос →"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create barrel export**

Create `src/components/quiz/index.ts`:

```ts
export { Quiz } from "./Quiz";
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/quiz/
git commit -m "feat: add Quiz component with instant feedback and scoring"
```

---

### Task 8: Narrative & Challenge Components

**Files:**
- Create: `src/components/narrative/NarrativeBox.tsx`
- Create: `src/components/narrative/index.ts`
- Create: `src/components/challenge/Challenge.tsx`
- Create: `src/components/challenge/index.ts`

- [ ] **Step 1: Create NarrativeBox component**

Create `src/components/narrative/NarrativeBox.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

interface NarrativeBoxProps {
  text: string;
  mentorName?: string;
}

export function NarrativeBox({ text, mentorName = "Алекс" }: NarrativeBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4"
    >
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-lg">
          🧑‍💻
        </div>
        <div>
          <div className="font-semibold text-sm mb-1">{mentorName} (наставник)</div>
          <div className="text-gray-300 text-sm leading-relaxed">{text}</div>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create Challenge component**

Create `src/components/challenge/Challenge.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChallengeTask } from "@/types";

interface ChallengeProps {
  task: ChallengeTask;
  onComplete: () => void;
}

export function Challenge({ task, onComplete }: ChallengeProps) {
  const [showHint, setShowHint] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(
    new Array(task.verificationSteps.length).fill(false)
  );

  const allChecked = checkedSteps.every(Boolean);

  function toggleStep(index: number) {
    setCheckedSteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
      <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-2">
        🏋️ Практика: {task.title}
      </h3>
      <p className="text-gray-300 text-sm mb-4">{task.description}</p>

      <div className="space-y-2 mb-4">
        <p className="text-sm font-medium text-gray-400">Чеклист проверки:</p>
        {task.verificationSteps.map((step, i) => (
          <label
            key={i}
            className="flex items-center gap-3 text-sm cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={checkedSteps[i]}
              onChange={() => toggleStep(i)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
            />
            <span className={checkedSteps[i] ? "text-gray-500 line-through" : "text-gray-300"}>
              {step}
            </span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          {showHint ? "Скрыть подсказку" : "💡 Показать подсказку"}
        </button>

        {allChecked && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onComplete}
            className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            Готово! ✅
          </motion.button>
        )}
      </div>

      {showHint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 p-3 bg-amber-500/5 rounded-lg text-sm text-amber-300/80 border border-amber-500/10"
        >
          💡 {task.hint}
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create barrel exports**

Create `src/components/narrative/index.ts`:

```ts
export { NarrativeBox } from "./NarrativeBox";
```

Create `src/components/challenge/index.ts`:

```ts
export { Challenge } from "./Challenge";
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/narrative/ src/components/challenge/
git commit -m "feat: add NarrativeBox (mentor dialog) and Challenge (practice task) components"
```

---

### Task 9: Level Registry & First Level

**Files:**
- Create: `src/levels/registry.ts`
- Create: `src/levels/01-init/meta.json`
- Create: `src/levels/01-init/Level.tsx`
- Create: `src/levels/02-first-commit/meta.json`
- Create: `src/levels/02-first-commit/Level.tsx`
- Create: `src/levels/sections.ts`

- [ ] **Step 1: Create sections config**

Create `src/levels/sections.ts`:

```ts
import { Section } from "@/types";

export interface SectionInfo {
  id: Section;
  title: string;
  story: string;
  icon: string;
}

export const SECTIONS: SectionInfo[] = [
  {
    id: "basics",
    title: "Основы",
    story: "Первый день: настраиваем рабочее место",
    icon: "📁",
  },
  {
    id: "branching",
    title: "Ветвление",
    story: "Первая задача: работаем над фичей",
    icon: "🌿",
  },
  {
    id: "remote",
    title: "Удалённые репо",
    story: "Подключаемся к команде",
    icon: "🌐",
  },
  {
    id: "github",
    title: "GitHub",
    story: "Первый Pull Request",
    icon: "🐙",
  },
  {
    id: "advanced",
    title: "Продвинутое",
    story: "Что-то пошло не так — спасаем ситуацию",
    icon: "🔧",
  },
  {
    id: "teamwork",
    title: "Командная работа",
    story: "Релиз: работаем вместе",
    icon: "👥",
  },
  {
    id: "internals",
    title: "Git internals",
    story: "Бонус: заглядываем под капот",
    icon: "⚙️",
  },
];
```

- [ ] **Step 2: Create first level — git init**

Create `src/levels/01-init/meta.json`:

```json
{
  "id": "01-init",
  "title": "Создаём первый репозиторий",
  "description": "Узнай что такое git init и зачем он нужен",
  "difficulty": 1,
  "xp": 100,
  "section": "basics",
  "tags": ["init", "repository"],
  "prerequisites": [],
  "estimatedMinutes": 5
}
```

Create `src/levels/01-init/Level.tsx`:

```tsx
"use client";

import { useState } from "react";
import { NarrativeBox } from "@/components/narrative";
import { TerminalSim } from "@/components/terminal-sim";
import { Quiz } from "@/components/quiz";
import { Challenge } from "@/components/challenge";
import { GitVisualizer } from "@/components/git-visualizer";
import { QuizQuestion, ChallengeTask, GitCommitNode, GitVisualizerStep } from "@/types";

const STEPS = ["narrative", "visualization", "quiz", "challenge"] as const;
type Step = (typeof STEPS)[number];

const initialCommits: GitCommitNode[] = [];

const visSteps: GitVisualizerStep[] = [
  {
    command: "git init",
    narration: "Создаётся пустой репозиторий — папка .git появляется в проекте",
    addCommits: [],
    addBranches: [{ name: "main", commitId: "", color: "#22c55e" }],
    moveHead: "main",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что делает команда git init?",
    options: [
      "Скачивает репозиторий с GitHub",
      "Создаёт новый пустой Git-репозиторий в текущей папке",
      "Делает первый коммит",
      "Устанавливает Git на компьютер",
    ],
    correctIndex: 1,
    explanation:
      "git init создаёт скрытую папку .git в текущей директории. Это превращает обычную папку в Git-репозиторий. Никакие файлы при этом не коммитятся.",
  },
  {
    question: "Что появляется после выполнения git init?",
    options: [
      "Файл README.md",
      "Скрытая папка .git",
      "Файл .gitignore",
      "Первый коммит",
    ],
    correctIndex: 1,
    explanation:
      "git init создаёт скрытую папку .git, которая содержит всю информацию о репозитории: историю, ветки, конфигурацию.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Создай свой первый репозиторий",
  description:
    "Открой терминал на своём компьютере, создай новую папку и инициализируй в ней Git-репозиторий.",
  hint: "mkdir my-project && cd my-project && git init",
  verificationSteps: [
    "Создал новую папку (mkdir my-project)",
    "Перешёл в неё (cd my-project)",
    "Выполнил git init",
    "Проверил, что .git папка появилась (ls -la)",
  ],
};

interface LevelProps {
  onComplete: (quizCorrect: number, quizTotal: number) => void;
}

export default function Level({ onComplete }: LevelProps) {
  const [currentStep, setCurrentStep] = useState<Step>("narrative");
  const [visStep, setVisStep] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number } | null>(null);

  const stepIndex = STEPS.indexOf(currentStep);

  function goNext() {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left: Content */}
      <div className="flex-1 space-y-6">
        {/* Step indicators */}
        <div className="flex gap-2">
          {STEPS.map((step, i) => (
            <button
              key={step}
              onClick={() => i <= stepIndex && setCurrentStep(step)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                i < stepIndex
                  ? "bg-emerald-500/20 text-emerald-400"
                  : i === stepIndex
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-gray-800 text-gray-600"
              }`}
            >
              {i < stepIndex && "✓ "}
              {step === "narrative"
                ? "История"
                : step === "visualization"
                ? "Визуализация"
                : step === "quiz"
                ? "Квиз"
                : "Практика"}
            </button>
          ))}
        </div>

        {/* Narrative */}
        {currentStep === "narrative" && (
          <div className="space-y-4">
            <NarrativeBox text="Добро пожаловать в команду! Я Алекс, буду твоим наставником. Первое, что нужно сделать — научиться создавать Git-репозиторий. Это как создать фотоальбом для кода — место, где будет храниться вся история изменений." />
            <button
              onClick={goNext}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
            >
              Далее →
            </button>
          </div>
        )}

        {/* Visualization */}
        {currentStep === "visualization" && (
          <div className="space-y-4">
            <NarrativeBox text="Смотри, что происходит когда ты выполняешь git init. Справа ты видишь, как создаётся пустой репозиторий с веткой main." />
            <TerminalSim
              lines={[
                { text: "mkdir my-project", type: "command" },
                { text: "cd my-project", type: "command" },
                { text: "git init", type: "command" },
                {
                  text: "Initialized empty Git repository in /home/user/my-project/.git/",
                  type: "success",
                },
                { text: "ls -la", type: "command" },
                { text: "drwxr-xr-x  .git", type: "output" },
              ]}
            />
            <button
              onClick={() => {
                setVisStep(1);
                goNext();
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
            >
              Далее: Квиз →
            </button>
          </div>
        )}

        {/* Quiz */}
        {currentStep === "quiz" && (
          <Quiz
            questions={quizQuestions}
            onComplete={(correct, total) => {
              setQuizResult({ correct, total });
              setQuizDone(true);
              setTimeout(goNext, 1500);
            }}
          />
        )}

        {/* Challenge */}
        {currentStep === "challenge" && (
          <div className="space-y-4">
            <NarrativeBox text="Отлично! Теперь попробуй сам. Открой терминал и создай свой первый репозиторий. Я подготовил чеклист — отмечай шаги по мере выполнения." />
            <Challenge
              task={challengeTask}
              onComplete={() => onComplete(quizResult?.correct ?? 0, quizResult?.total ?? 0)}
            />
          </div>
        )}
      </div>

      {/* Right: Git Visualizer */}
      <div className="lg:w-80 w-full">
        <GitVisualizer
          initial={initialCommits}
          steps={visSteps}
          currentStep={visStep}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create second level — first commit**

Create `src/levels/02-first-commit/meta.json`:

```json
{
  "id": "02-first-commit",
  "title": "Первый коммит",
  "description": "Научись отслеживать файлы и делать коммиты",
  "difficulty": 1,
  "xp": 150,
  "section": "basics",
  "tags": ["add", "commit", "staging"],
  "prerequisites": ["01-init"],
  "estimatedMinutes": 7
}
```

Create `src/levels/02-first-commit/Level.tsx`:

```tsx
"use client";

import { useState } from "react";
import { NarrativeBox } from "@/components/narrative";
import { TerminalSim } from "@/components/terminal-sim";
import { Quiz } from "@/components/quiz";
import { Challenge } from "@/components/challenge";
import { GitVisualizer } from "@/components/git-visualizer";
import { QuizQuestion, ChallengeTask, GitCommitNode, GitVisualizerStep } from "@/types";

const STEPS = ["narrative", "visualization", "quiz", "challenge"] as const;
type Step = (typeof STEPS)[number];

const initialCommits: GitCommitNode[] = [];

const visSteps: GitVisualizerStep[] = [
  {
    command: "git add README.md",
    narration: "Файл добавлен в staging area — он готов к коммиту",
    addBranches: [{ name: "main", commitId: "", color: "#22c55e" }],
    moveHead: "main",
  },
  {
    command: 'git commit -m "Initial commit"',
    narration: "Создан первый коммит! Он сохранил снимок всех файлов из staging area",
    addCommits: [{ id: "a1b2c3", message: "Initial commit", branch: "main" }],
    moveHead: "main",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что делает git add?",
    options: [
      "Создаёт новый коммит",
      "Добавляет файлы в staging area (индекс)",
      "Отправляет изменения на GitHub",
      "Создаёт новую ветку",
    ],
    correctIndex: 1,
    explanation:
      "git add перемещает файлы в staging area — промежуточную зону. Только файлы из staging area попадут в следующий коммит.",
  },
  {
    question: "Что такое коммит в Git?",
    options: [
      "Удаление файла из проекта",
      "Снимок (snapshot) текущего состояния отслеживаемых файлов",
      "Отправка кода на сервер",
      "Создание новой папки",
    ],
    correctIndex: 1,
    explanation:
      "Коммит — это снимок проекта в определённый момент времени. Он записывает состояние всех файлов из staging area и сохраняет его в историю.",
  },
  {
    question: "Какой флаг позволяет добавить сообщение к коммиту?",
    options: ["-a", "-m", "-msg", "--text"],
    correctIndex: 1,
    explanation:
      'Флаг -m позволяет указать сообщение коммита прямо в команде: git commit -m "Моё сообщение".',
  },
];

const challengeTask: ChallengeTask = {
  title: "Сделай свой первый коммит",
  description:
    "Создай файл в своём репозитории, добавь его в staging area и сделай коммит.",
  hint: 'echo "# My Project" > README.md && git add README.md && git commit -m "Initial commit"',
  verificationSteps: [
    "Создал файл (например, README.md)",
    "Добавил файл в staging: git add README.md",
    'Сделал коммит: git commit -m "Initial commit"',
    "Проверил историю: git log",
  ],
};

interface LevelProps {
  onComplete: (quizCorrect: number, quizTotal: number) => void;
}

export default function Level({ onComplete }: LevelProps) {
  const [currentStep, setCurrentStep] = useState<Step>("narrative");
  const [visStep, setVisStep] = useState(0);
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number } | null>(null);

  const stepIndex = STEPS.indexOf(currentStep);

  function goNext() {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 space-y-6">
        <div className="flex gap-2">
          {STEPS.map((step, i) => (
            <button
              key={step}
              onClick={() => i <= stepIndex && setCurrentStep(step)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                i < stepIndex
                  ? "bg-emerald-500/20 text-emerald-400"
                  : i === stepIndex
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-gray-800 text-gray-600"
              }`}
            >
              {i < stepIndex && "✓ "}
              {step === "narrative"
                ? "История"
                : step === "visualization"
                ? "Визуализация"
                : step === "quiz"
                ? "Квиз"
                : "Практика"}
            </button>
          ))}
        </div>

        {currentStep === "narrative" && (
          <div className="space-y-4">
            <NarrativeBox text="Отлично, репозиторий создан! Но он пока пустой — ни одного коммита. Давай разберёмся с двумя ключевыми командами: git add и git commit. Представь, что add — это положить вещи в коробку, а commit — заклеить коробку и подписать её." />
            <button onClick={goNext} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors">
              Далее →
            </button>
          </div>
        )}

        {currentStep === "visualization" && (
          <div className="space-y-4">
            <NarrativeBox text="Смотри на граф справа. Сначала мы добавляем файл в staging area командой git add, а затем делаем коммит — он появляется как узел на графе." />
            <TerminalSim
              lines={[
                { text: 'echo "# My Project" > README.md', type: "command" },
                { text: "git add README.md", type: "command" },
                { text: "git status", type: "command" },
                { text: "Changes to be committed:", type: "success" },
                { text: "  new file: README.md", type: "output" },
                { text: 'git commit -m "Initial commit"', type: "command" },
                { text: "[main (root-commit) a1b2c3d] Initial commit", type: "success" },
                { text: " 1 file changed, 1 insertion(+)", type: "output" },
              ]}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setVisStep(1)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                git add
              </button>
              <button
                onClick={() => setVisStep(2)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                git commit
              </button>
              <button
                onClick={goNext}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Далее →
              </button>
            </div>
          </div>
        )}

        {currentStep === "quiz" && (
          <Quiz
            questions={quizQuestions}
            onComplete={(correct, total) => {
              setQuizResult({ correct, total });
              setTimeout(goNext, 1500);
            }}
          />
        )}

        {currentStep === "challenge" && (
          <div className="space-y-4">
            <NarrativeBox text="Теперь твоя очередь! Создай файл, добавь его и сделай первый коммит в своём репозитории." />
            <Challenge
              task={challengeTask}
              onComplete={() => onComplete(quizResult?.correct ?? 0, quizResult?.total ?? 0)}
            />
          </div>
        )}
      </div>

      <div className="lg:w-80 w-full">
        <GitVisualizer initial={initialCommits} steps={visSteps} currentStep={visStep} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create level registry**

Create `src/levels/registry.ts`:

```ts
import { LevelMeta } from "@/types";
import { ComponentType } from "react";

import meta01 from "./01-init/meta.json";
import meta02 from "./02-first-commit/meta.json";

interface LevelEntry {
  meta: LevelMeta;
  load: () => Promise<{ default: ComponentType<{ onComplete: (correct: number, total: number) => void }> }>;
}

export const LEVELS: LevelEntry[] = [
  {
    meta: meta01 as LevelMeta,
    load: () => import("./01-init/Level"),
  },
  {
    meta: meta02 as LevelMeta,
    load: () => import("./02-first-commit/Level"),
  },
];

export function getLevelById(id: string): LevelEntry | undefined {
  return LEVELS.find((l) => l.meta.id === id);
}

export function getLevelsBySection(section: string): LevelEntry[] {
  return LEVELS.filter((l) => l.meta.section === section);
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/levels/
git commit -m "feat: add level registry, sections config, and first two levels (init, first-commit)"
```

---

### Task 10: Level Page

**Files:**
- Create: `src/app/level/[id]/page.tsx`
- Create: `src/components/ui/Navbar.tsx`

- [ ] **Step 1: Create Navbar component**

Create `src/components/ui/Navbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameStorage } from "@/engine/storage";
import { PlayerData, RANK_THRESHOLDS } from "@/types";

export function Navbar() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    setPlayer(GameStorage.load());
  }, []);

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg hover:text-indigo-400 transition-colors">
          🎮 GitQuest
        </Link>

        <div className="flex items-center gap-4">
          {player && (
            <>
              <span className="text-sm text-indigo-400">
                ⭐ {player.totalXp} XP
              </span>
              <Link
                href="/profile"
                className="text-sm bg-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-700 transition-colors"
              >
                {player.rank}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add Navbar to layout**

Update `src/app/layout.tsx` — add Navbar import and render it inside `<body>` above `{children}`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "GitQuest — Изучай Git играючи",
  description: "Интерактивная веб-игра для изучения Git и GitHub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create level page**

Create `src/app/level/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getLevelById } from "@/levels/registry";
import { GameStorage } from "@/engine/storage";
import { completeLevel, addQuizScore } from "@/engine/progress";
import { checkNewBadges } from "@/engine/achievements";
import { LevelMeta } from "@/types";

type ComponentType = React.ComponentType<{
  onComplete: (quizCorrect: number, quizTotal: number) => void;
}>;

export default function LevelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [LevelComponent, setLevelComponent] = useState<ComponentType | null>(null);
  const [meta, setMeta] = useState<LevelMeta | null>(null);
  const [completed, setCompleted] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    const entry = getLevelById(id);
    if (!entry) {
      router.push("/");
      return;
    }
    setMeta(entry.meta);

    // Record start time for speedrun badge
    const player = GameStorage.load();
    GameStorage.save({
      ...player,
      levelStartTimes: { ...player.levelStartTimes, [id]: Date.now() },
    });

    entry.load().then((mod) => setLevelComponent(() => mod.default));
  }, [id, router]);

  function handleComplete(quizCorrect: number, quizTotal: number) {
    if (!meta) return;

    let player = GameStorage.load();
    player = addQuizScore(player, meta.id, quizCorrect, quizTotal);
    player = completeLevel(player, meta.id, meta.xp);

    const badges = checkNewBadges(player);
    if (badges.length > 0) {
      player = { ...player, badges: [...player.badges, ...badges] };
    }

    GameStorage.save(player);
    setNewBadges(badges);
    setCompleted(true);
  }

  if (!LevelComponent || !meta) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse text-gray-500">Загрузка уровня...</div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Уровень пройден!</h2>
          <p className="text-indigo-400 text-lg mb-2">+{meta.xp} XP</p>

          {newBadges.length > 0 && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 font-medium">Новые бейджи:</p>
              {newBadges.map((b) => (
                <span key={b} className="text-amber-300">{b} </span>
              ))}
            </div>
          )}

          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              К карте уровней
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{meta.title}</h1>
        <p className="text-gray-400 text-sm mt-1">{meta.description}</p>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="text-indigo-400">⭐ {meta.xp} XP</span>
          <span
            className={
              meta.difficulty <= 2
                ? "text-emerald-400"
                : meta.difficulty <= 4
                ? "text-amber-400"
                : "text-red-400"
            }
          >
            {"●".repeat(meta.difficulty)}{"○".repeat(5 - meta.difficulty)} Сложность
          </span>
        </div>
      </div>
      <LevelComponent onComplete={handleComplete} />
    </div>
  );
}
```

- [ ] **Step 4: Verify dev server renders level page**

Run: `npm run dev`
Open: http://localhost:3000/level/01-init
Expected: Level page renders with narrative, step indicators, and git visualizer.

- [ ] **Step 5: Commit**

```bash
git add src/app/level/ src/app/layout.tsx src/components/ui/
git commit -m "feat: add level page with dynamic loading, Navbar, and completion flow"
```

---

### Task 11: Home Page — Level Map

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement home page with level map**

Replace `src/app/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LEVELS } from "@/levels/registry";
import { SECTIONS } from "@/levels/sections";
import { GameStorage } from "@/engine/storage";
import { PlayerData } from "@/types";

export default function Home() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    setPlayer(GameStorage.load());
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">
          Изучай <span className="text-indigo-400">Git</span> играючи
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Интерактивные визуализации, квизы и практические задания.
          Пройди путь от новичка до эксперта.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {SECTIONS.map((section) => {
          const sectionLevels = LEVELS.filter(
            (l) => l.meta.section === section.id
          );
          if (sectionLevels.length === 0) return null;

          const completedCount = player
            ? sectionLevels.filter((l) =>
                player.completedLevels.includes(l.meta.id)
              ).length
            : 0;
          const progress =
            sectionLevels.length > 0
              ? (completedCount / sectionLevels.length) * 100
              : 0;

          return (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Section header */}
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">
                  {section.icon} {section.story}
                </h2>
                <span className="text-sm text-gray-500">
                  {completedCount}/{sectionLevels.length} пройдено
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-800 rounded-full mb-4">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Level cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sectionLevels.map((level) => {
                  const isCompleted = player?.completedLevels.includes(
                    level.meta.id
                  );
                  const diffColor =
                    level.meta.difficulty <= 2
                      ? "text-emerald-400"
                      : level.meta.difficulty <= 4
                      ? "text-amber-400"
                      : "text-red-400";

                  return (
                    <Link
                      key={level.meta.id}
                      href={`/level/${level.meta.id}`}
                      className={`block p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                        isCompleted
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-gray-900/50 border-gray-800 hover:border-indigo-500/50"
                      }`}
                    >
                      <div className="text-xs mb-1">
                        {isCompleted ? (
                          <span className="text-emerald-400">✅ Пройдено</span>
                        ) : (
                          <span className="text-gray-600">○ Не пройдено</span>
                        )}
                      </div>
                      <div className="font-semibold">{level.meta.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {level.meta.description}
                      </div>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-indigo-400">
                          ⭐ {level.meta.xp} XP
                        </span>
                        <span className={diffColor}>
                          {"●".repeat(level.meta.difficulty)}
                          {"○".repeat(5 - level.meta.difficulty)}
                        </span>
                        <span className="text-gray-600">
                          ~{level.meta.estimatedMinutes} мин
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify home page**

Run: `npm run dev`
Open: http://localhost:3000
Expected: Level map with "Основы" section showing 2 levels (git init, first commit) with progress bar.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home page with level map, sections, and progress tracking"
```

---

### Task 12: Profile Page

**Files:**
- Create: `src/app/profile/page.tsx`

- [ ] **Step 1: Create profile page**

Create `src/app/profile/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameStorage } from "@/engine/storage";
import { BADGES } from "@/engine/achievements";
import { LEVELS } from "@/levels/registry";
import { PlayerData, RANK_THRESHOLDS, Rank } from "@/types";

const RANKS_ORDER: Rank[] = ["Intern", "Junior", "Middle", "Senior", "Lead", "Architect"];

export default function ProfilePage() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    setPlayer(GameStorage.load());
  }, []);

  if (!player) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse text-gray-500">Загрузка...</div>
      </div>
    );
  }

  const currentRankIndex = RANKS_ORDER.indexOf(player.rank);
  const nextRank = RANKS_ORDER[currentRankIndex + 1];
  const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : player.totalXp;
  const currentThreshold = RANK_THRESHOLDS[player.rank];
  const xpProgress =
    ((player.totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  const totalQuizzes = Object.keys(player.quizScores).length;
  const perfectQuizzes = Object.values(player.quizScores).filter(
    (s) => s.correct === s.total
  ).length;
  const accuracy =
    totalQuizzes > 0
      ? Math.round(
          (Object.values(player.quizScores).reduce((sum, s) => sum + s.correct, 0) /
            Object.values(player.quizScores).reduce((sum, s) => sum + s.total, 0)) *
            100
        )
      : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-3xl">
          🧑‍💻
        </div>
        <div>
          <h1 className="text-2xl font-bold">Профиль</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="bg-indigo-600 px-3 py-0.5 rounded-full text-sm">
              {player.rank}
            </span>
            <span className="text-indigo-400 text-sm">
              ⭐ {player.totalXp}{nextRank ? ` / ${nextThreshold}` : ""} XP
            </span>
          </div>
          {nextRank && (
            <div className="mt-2 w-48">
              <div className="h-2 bg-gray-800 rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {nextThreshold - player.totalXp} XP до {nextRank}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">{player.completedLevels.length}</div>
          <div className="text-xs text-gray-500 mt-1">Уровней пройдено</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">{accuracy}%</div>
          <div className="text-xs text-gray-500 mt-1">Точность квизов</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">{player.badges.length}</div>
          <div className="text-xs text-gray-500 mt-1">Бейджи</div>
        </div>
      </div>

      {/* Badges */}
      <h2 className="font-semibold mb-4">Бейджи</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BADGES.map((badge) => {
          const unlocked = player.badges.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border text-center transition-all ${
                unlocked
                  ? "bg-indigo-500/5 border-indigo-500/20"
                  : "bg-gray-900/30 border-gray-800 opacity-40"
              }`}
            >
              <div className="text-3xl mb-2">{unlocked ? badge.icon : "🔒"}</div>
              <div className="text-sm font-medium">{badge.name}</div>
              <div className="text-xs text-gray-500 mt-1">{badge.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify profile page**

Run: `npm run dev`
Open: http://localhost:3000/profile
Expected: Profile page with rank, XP bar, stats (all zeros for fresh player), and badge collection.

- [ ] **Step 3: Commit**

```bash
git add src/app/profile/
git commit -m "feat: add profile page with rank, stats, XP progress, and badges"
```

---

### Task 13: End-to-End Verification

**Files:** None (verification only)

- [ ] **Step 1: Verify full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Run all tests**

Run: `npx jest`
Expected: All tests pass.

- [ ] **Step 4: Manual flow test**

Run: `npm run dev` and test this flow:
1. Open http://localhost:3000 — see level map with 2 levels
2. Click "Создаём первый репозиторий" — level page loads
3. Walk through narrative → visualization → quiz → challenge
4. Complete challenge → see completion screen with XP
5. Return to map — level shows as completed, progress bar updated
6. Open /profile — stats updated, badge "Первый коммит" unlocked

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify full build and e2e flow"
```
