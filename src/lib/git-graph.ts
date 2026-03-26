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
    for (const newBranch of step.addBranches) {
      const existingIndex = branches.findIndex((b) => b.name === newBranch.name);
      if (existingIndex >= 0) {
        branches = branches.map((b, i) => (i === existingIndex ? newBranch : b));
      } else {
        branches = [...branches, newBranch];
      }
    }
  }

  if (step.removeBranches) {
    branches = branches.filter((b) => !step.removeBranches!.includes(b.name));
  }

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
