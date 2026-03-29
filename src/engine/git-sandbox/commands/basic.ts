import { EngineState, CommandOutput, ParsedCommand, CommitObject, generateId } from "../types";

export function execInit(state: EngineState): CommandOutput {
  state.initialized = true;
  state.workingDir = new Map();
  state.stagingArea = new Map();
  state.commits = [];
  state.branches = new Map([["main", ""]]);
  state.head = "main";
  state.isDetached = false;
  state.remotes = new Map();
  state.stash = [];
  state.reflog = [];
  state.conflictFiles = new Map();
  state.tags = new Map();
  state.bisect = null;

  return {
    lines: [
      { text: "Initialized empty Git repository", type: "success" },
    ],
  };
}

export function execAdd(state: EngineState, cmd: ParsedCommand): CommandOutput {
  if (cmd.args[0] === ".") {
    for (const [path, content] of state.workingDir) {
      state.stagingArea.set(path, content);
    }
    // Handle deleted files
    const lastSnapshot = getLastSnapshot(state);
    for (const path of lastSnapshot.keys()) {
      if (!state.workingDir.has(path)) {
        state.stagingArea.delete(path);
      }
    }
    return { lines: [] };
  }

  for (const filePath of cmd.args) {
    const content = state.workingDir.get(filePath);
    if (content !== undefined) {
      state.stagingArea.set(filePath, content);
    } else if (getLastSnapshot(state).has(filePath)) {
      // File was deleted from working dir — stage deletion
      state.stagingArea.delete(filePath);
    } else {
      return {
        lines: [{ text: `fatal: pathspec '${filePath}' did not match any files`, type: "error" }],
      };
    }
  }

  return { lines: [] };
}

export function execCommit(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const message = typeof cmd.flags["m"] === "string" ? cmd.flags["m"] : "";

  if (!message) {
    return {
      lines: [{ text: "Aborting commit: use -m \"message\"", type: "error" }],
    };
  }

  const lastSnapshot = getLastSnapshot(state);
  const hasChanges = !mapsEqual(state.stagingArea, lastSnapshot);

  if (!hasChanges) {
    return {
      lines: [
        { text: "nothing to commit, working tree clean", type: state.commits.length > 0 ? "warning" : "error" },
        { text: "Hint: stage files first with git add <file>", type: "hint" },
      ],
    };
  }

  const id = generateId();
  const currentBranch = state.isDetached ? null : state.head;
  const parentId = getCurrentCommitId(state);

  const commit: CommitObject = {
    id,
    message,
    timestamp: Date.now(),
    parentId,
    secondParentId: null,
    snapshot: new Map(state.stagingArea),
    branch: currentBranch ?? "detached",
  };

  state.commits.push(commit);

  if (currentBranch) {
    state.branches.set(currentBranch, id);
  } else {
    state.head = id;
  }

  state.reflog.unshift({
    commitId: id,
    action: "commit",
    message: `commit: ${message}`,
  });

  return {
    lines: [
      {
        text: `[${currentBranch ?? id.slice(0, 7)} ${id.slice(0, 7)}] ${message}`,
        type: "success",
      },
      {
        text: ` ${state.stagingArea.size} file(s) changed`,
        type: "info",
      },
    ],
  };
}

export function execStatus(state: EngineState): CommandOutput {
  const lines: CommandOutput["lines"] = [];
  const branch = state.isDetached ? `HEAD detached at ${state.head.slice(0, 7)}` : `On branch ${state.head}`;
  lines.push({ text: branch, type: "info" });

  const lastSnapshot = getLastSnapshot(state);

  // Staged changes
  const staged: string[] = [];
  for (const [path, content] of state.stagingArea) {
    if (!lastSnapshot.has(path)) {
      staged.push(`  new file:   ${path}`);
    } else if (lastSnapshot.get(path) !== content) {
      staged.push(`  modified:   ${path}`);
    }
  }
  for (const path of lastSnapshot.keys()) {
    if (!state.stagingArea.has(path)) {
      staged.push(`  deleted:    ${path}`);
    }
  }

  if (staged.length > 0) {
    lines.push({ text: "", type: "info" });
    lines.push({ text: "Changes to be committed:", type: "success" });
    staged.forEach((s) => lines.push({ text: s, type: "success" }));
  }

  // Unstaged changes
  const unstaged: string[] = [];
  for (const [path, content] of state.workingDir) {
    const stagedContent = state.stagingArea.get(path);
    if (stagedContent !== undefined && stagedContent !== content) {
      unstaged.push(`  modified:   ${path}`);
    }
  }
  for (const path of state.stagingArea.keys()) {
    if (!state.workingDir.has(path)) {
      unstaged.push(`  deleted:    ${path}`);
    }
  }

  if (unstaged.length > 0) {
    lines.push({ text: "", type: "info" });
    lines.push({ text: "Changes not staged for commit:", type: "warning" });
    unstaged.forEach((s) => lines.push({ text: s, type: "warning" }));
  }

  // Untracked
  const untracked: string[] = [];
  for (const path of state.workingDir.keys()) {
    if (!state.stagingArea.has(path) && !lastSnapshot.has(path)) {
      untracked.push(`  ${path}`);
    }
  }

  if (untracked.length > 0) {
    lines.push({ text: "", type: "info" });
    lines.push({ text: "Untracked files:", type: "error" });
    untracked.forEach((s) => lines.push({ text: s, type: "error" }));
  }

  if (staged.length === 0 && unstaged.length === 0 && untracked.length === 0) {
    lines.push({ text: "nothing to commit, working tree clean", type: "info" });
  }

  return { lines };
}

export function execLog(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const oneline = cmd.flags["oneline"] === true;
  const lines: CommandOutput["lines"] = [];

  // Get commits reachable from HEAD
  const reachable = getReachableCommits(state);

  for (const commit of reachable) {
    if (oneline) {
      const branchLabel = getBranchLabels(state, commit.id);
      const label = branchLabel ? ` (${branchLabel})` : "";
      lines.push({
        text: `${commit.id.slice(0, 7)}${label} ${commit.message}`,
        type: "info",
      });
    } else {
      lines.push({ text: `commit ${commit.id}`, type: "warning" });
      lines.push({ text: `    ${commit.message}`, type: "info" });
      lines.push({ text: "", type: "info" });
    }
  }

  if (lines.length === 0) {
    lines.push({ text: "No commits yet", type: "info" });
  }

  return { lines };
}

export function execDiff(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const staged = cmd.flags["staged"] === true || cmd.flags["cached"] === true;
  const lines: CommandOutput["lines"] = [];

  if (staged) {
    // Compare staging area vs last commit
    const lastSnapshot = getLastSnapshot(state);
    appendDiffLines(lines, lastSnapshot, state.stagingArea);
  } else {
    // Compare working dir vs staging area
    appendDiffLines(lines, state.stagingArea, state.workingDir);
  }

  if (lines.length === 0) {
    lines.push({ text: "No changes", type: "info" });
  }

  return { lines };
}

function appendDiffLines(
  lines: CommandOutput["lines"],
  base: Map<string, string>,
  target: Map<string, string>
) {
  const allPaths = new Set([...base.keys(), ...target.keys()]);

  for (const path of allPaths) {
    const baseContent = base.get(path) ?? "";
    const targetContent = target.get(path) ?? "";

    if (baseContent === targetContent) continue;

    lines.push({ text: `diff --git a/${path} b/${path}`, type: "info" });

    const baseLines = baseContent ? baseContent.split("\n") : [];
    const targetLines = targetContent ? targetContent.split("\n") : [];

    for (const line of baseLines) {
      if (!targetLines.includes(line)) {
        lines.push({ text: `-${line}`, type: "error" });
      }
    }
    for (const line of targetLines) {
      if (!baseLines.includes(line)) {
        lines.push({ text: `+${line}`, type: "success" });
      }
    }
  }
}

// Helpers exported for use by other command modules
export function getLastSnapshot(state: EngineState): Map<string, string> {
  const commitId = getCurrentCommitId(state);
  if (!commitId) return new Map();
  const commit = state.commits.find((c) => c.id === commitId);
  return commit ? new Map(commit.snapshot) : new Map();
}

export function getCurrentCommitId(state: EngineState): string | null {
  if (state.isDetached) {
    return state.head;
  }
  return state.branches.get(state.head) || null;
}

export function getCommitById(state: EngineState, id: string): CommitObject | undefined {
  return state.commits.find(
    (c) => c.id === id || c.id.startsWith(id)
  );
}

export function getReachableCommits(state: EngineState): CommitObject[] {
  const headCommitId = getCurrentCommitId(state);
  if (!headCommitId) return [];

  const result: CommitObject[] = [];
  let currentId: string | null = headCommitId;

  while (currentId) {
    const commit = state.commits.find((c) => c.id === currentId);
    if (!commit) break;
    result.push(commit);
    currentId = commit.parentId;
  }

  return result;
}

export function getBranchLabels(state: EngineState, commitId: string): string {
  const labels: string[] = [];
  for (const [name, cId] of state.branches) {
    if (cId === commitId) {
      if (!state.isDetached && name === state.head) {
        labels.unshift(`HEAD -> ${name}`);
      } else {
        labels.push(name);
      }
    }
  }
  for (const [name, cId] of state.tags) {
    if (cId === commitId) {
      labels.push(`tag: ${name}`);
    }
  }
  return labels.join(", ");
}

function mapsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, val] of a) {
    if (b.get(key) !== val) return false;
  }
  return true;
}
