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

export interface GitTagRef {
  name: string;
  commitId: string;
}

export interface GitGraphState {
  commits: GitCommitNode[];
  branches: GitBranchRef[];
  tags?: GitTagRef[];
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
