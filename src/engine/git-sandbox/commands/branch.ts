import { EngineState, CommandOutput, ParsedCommand, CommitObject, generateId } from "../types";
import { getLastSnapshot, getCurrentCommitId, getCommitById, getReachableCommits } from "./basic";

export function execBranch(state: EngineState, cmd: ParsedCommand): CommandOutput {
  // git branch -d <name> → delete branch
  if (cmd.flags["d"] === true || cmd.flags["D"] === true) {
    const branchName = cmd.args[0];
    if (!branchName) {
      return { lines: [{ text: "fatal: branch name required", type: "error" }] };
    }
    if (!state.branches.has(branchName)) {
      return { lines: [{ text: `error: branch '${branchName}' not found`, type: "error" }] };
    }
    if (!state.isDetached && state.head === branchName) {
      return { lines: [{ text: `error: Cannot delete branch '${branchName}' checked out at current HEAD`, type: "error" }] };
    }

    // Check if unmerged (warn but still delete for -d in our simplified model)
    const lines: CommandOutput["lines"] = [];
    if (cmd.flags["d"] === true) {
      // Check if the branch commits are reachable from HEAD
      const branchCommitId = state.branches.get(branchName);
      const headReachable = getReachableCommitIds(state, getCurrentCommitId(state));
      if (branchCommitId && !headReachable.has(branchCommitId)) {
        lines.push({ text: `warning: deleting branch '${branchName}' that is not fully merged`, type: "warning" });
      }
    }

    state.branches.delete(branchName);
    lines.push({ text: `Deleted branch ${branchName}`, type: "success" });
    return { lines };
  }

  // git branch <name> → create branch
  if (cmd.args.length > 0) {
    const branchName = cmd.args[0];
    if (state.branches.has(branchName)) {
      return { lines: [{ text: `fatal: A branch named '${branchName}' already exists`, type: "error" }] };
    }
    const headCommitId = getCurrentCommitId(state);
    state.branches.set(branchName, headCommitId ?? "");
    return { lines: [{ text: `Created branch '${branchName}'`, type: "success" }] };
  }

  // git branch (no args) → list branches
  const lines: CommandOutput["lines"] = [];
  const branchNames = [...state.branches.keys()].sort();
  for (const name of branchNames) {
    if (!state.isDetached && name === state.head) {
      lines.push({ text: `* ${name}`, type: "success" });
    } else {
      lines.push({ text: `  ${name}`, type: "info" });
    }
  }
  return { lines };
}

export function execSwitch(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const createFlag = cmd.flags["c"] === true;
  const branchName = cmd.args[0];

  if (!branchName) {
    return { lines: [{ text: "fatal: missing branch name", type: "error" }] };
  }

  if (createFlag) {
    // Create the branch first
    if (state.branches.has(branchName)) {
      return { lines: [{ text: `fatal: A branch named '${branchName}' already exists`, type: "error" }] };
    }
    const headCommitId = getCurrentCommitId(state);
    state.branches.set(branchName, headCommitId ?? "");
  } else {
    // Branch must exist
    if (!state.branches.has(branchName)) {
      return {
        lines: [
          { text: `fatal: invalid reference: '${branchName}'`, type: "error" },
          { text: `Hint: if you want to create '${branchName}', use git switch -c ${branchName}`, type: "hint" },
        ],
      };
    }
  }

  return switchToBranch(state, branchName);
}

export function execCheckout(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const createFlag = cmd.flags["b"] === true;
  const target = cmd.args[0];

  if (!target) {
    return { lines: [{ text: "fatal: missing branch or commit argument", type: "error" }] };
  }

  if (createFlag) {
    // Same as git switch -c
    if (state.branches.has(target)) {
      return { lines: [{ text: `fatal: A branch named '${target}' already exists`, type: "error" }] };
    }
    const headCommitId = getCurrentCommitId(state);
    state.branches.set(target, headCommitId ?? "");
    return switchToBranch(state, target);
  }

  // Check if target is a branch name
  if (state.branches.has(target)) {
    return switchToBranch(state, target);
  }

  // Check if target matches a commit id (or prefix)
  const commit = getCommitById(state, target);
  if (commit) {
    // Enter detached HEAD
    state.head = commit.id;
    state.isDetached = true;

    // Restore working dir and staging from commit snapshot
    state.workingDir = new Map(commit.snapshot);
    state.stagingArea = new Map(commit.snapshot);

    state.reflog.unshift({
      commitId: commit.id,
      action: "checkout",
      message: `checkout: moving to ${target}`,
    });

    return {
      lines: [
        { text: `HEAD is now at ${commit.id.slice(0, 7)} ${commit.message}`, type: "warning" },
        { text: "You are in 'detached HEAD' state.", type: "warning" },
      ],
    };
  }

  return {
    lines: [{ text: `error: pathspec '${target}' did not match any branch or commit`, type: "error" }],
  };
}

export function execMerge(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const targetBranch = cmd.args[0];

  if (!targetBranch) {
    return { lines: [{ text: "fatal: missing branch name to merge", type: "error" }] };
  }

  if (!state.branches.has(targetBranch)) {
    return { lines: [{ text: `merge: '${targetBranch}' - not something we can merge`, type: "error" }] };
  }

  const currentBranch = state.isDetached ? null : state.head;
  if (currentBranch === targetBranch) {
    return { lines: [{ text: `Already up to date. Cannot merge a branch into itself.`, type: "error" }] };
  }

  const currentCommitId = getCurrentCommitId(state);
  const targetCommitId = state.branches.get(targetBranch)!;

  if (!currentCommitId || !targetCommitId) {
    return { lines: [{ text: "fatal: no commits to merge", type: "error" }] };
  }

  if (currentCommitId === targetCommitId) {
    return { lines: [{ text: "Already up to date.", type: "info" }] };
  }

  // Find the merge base (common ancestor)
  const currentReachable = getReachableCommitIds(state, currentCommitId);
  const targetReachable = getReachableCommitIds(state, targetCommitId);

  // Find common ancestor: walk target's history and find the first commit reachable from current
  let mergeBase: string | null = null;
  const targetHistory = getReachableCommitList(state, targetCommitId);
  for (const commit of targetHistory) {
    if (currentReachable.has(commit.id)) {
      mergeBase = commit.id;
      break;
    }
  }

  // Check for fast-forward: current HEAD is an ancestor of target
  if (currentReachable.has(targetCommitId)) {
    // Already up to date
    return { lines: [{ text: "Already up to date.", type: "info" }] };
  }

  if (targetReachable.has(currentCommitId)) {
    // Fast-forward: current is ancestor of target, just move pointer
    if (currentBranch) {
      state.branches.set(currentBranch, targetCommitId);
    } else {
      state.head = targetCommitId;
    }

    // Update working dir and staging from target commit
    const targetCommit = state.commits.find((c) => c.id === targetCommitId);
    if (targetCommit) {
      state.workingDir = new Map(targetCommit.snapshot);
      state.stagingArea = new Map(targetCommit.snapshot);
    }

    state.reflog.unshift({
      commitId: targetCommitId,
      action: "merge",
      message: `merge ${targetBranch}: Fast-forward`,
    });

    return {
      lines: [
        { text: `Updating ${currentCommitId.slice(0, 7)}..${targetCommitId.slice(0, 7)}`, type: "info" },
        { text: "Fast-forward", type: "success" },
      ],
    };
  }

  // 3-way merge: both branches have diverged
  if (!mergeBase) {
    return { lines: [{ text: "fatal: refusing to merge unrelated histories", type: "error" }] };
  }

  const baseCommit = state.commits.find((c) => c.id === mergeBase);
  const currentCommit = state.commits.find((c) => c.id === currentCommitId);
  const targetCommit = state.commits.find((c) => c.id === targetCommitId);

  if (!baseCommit || !currentCommit || !targetCommit) {
    return { lines: [{ text: "fatal: cannot find commits for merge", type: "error" }] };
  }

  const baseSnapshot = baseCommit.snapshot;
  const currentSnapshot = currentCommit.snapshot;
  const targetSnapshot = targetCommit.snapshot;

  // Compute merged snapshot
  const allFiles = new Set([
    ...baseSnapshot.keys(),
    ...currentSnapshot.keys(),
    ...targetSnapshot.keys(),
  ]);

  const mergedSnapshot = new Map<string, string>();
  const conflicts = new Map<string, { ours: string; theirs: string }>();

  for (const file of allFiles) {
    const baseContent = baseSnapshot.get(file);
    const currentContent = currentSnapshot.get(file);
    const targetContent = targetSnapshot.get(file);

    if (currentContent === targetContent) {
      // Both branches have the same content (or both deleted)
      if (currentContent !== undefined) {
        mergedSnapshot.set(file, currentContent);
      }
    } else if (currentContent === baseContent) {
      // Only target changed the file — take target's version
      if (targetContent !== undefined) {
        mergedSnapshot.set(file, targetContent);
      }
      // if targetContent is undefined, file was deleted on target
    } else if (targetContent === baseContent) {
      // Only current changed the file — take current's version
      if (currentContent !== undefined) {
        mergedSnapshot.set(file, currentContent);
      }
      // if currentContent is undefined, file was deleted on current
    } else {
      // Both branches changed the file differently = CONFLICT
      const ours = currentContent ?? "";
      const theirs = targetContent ?? "";
      conflicts.set(file, { ours, theirs });

      const conflictMarkers = [
        `<<<<<<< ${currentBranch ?? "HEAD"}`,
        ours,
        "=======",
        theirs,
        `>>>>>>> ${targetBranch}`,
      ].join("\n");
      mergedSnapshot.set(file, conflictMarkers);
    }
  }

  if (conflicts.size > 0) {
    // Set conflict state
    state.conflictFiles = conflicts;
    state.workingDir = new Map(mergedSnapshot);
    state.stagingArea = new Map(currentSnapshot); // Keep current staging

    const lines: CommandOutput["lines"] = [];
    for (const file of conflicts.keys()) {
      lines.push({ text: `CONFLICT (content): Merge conflict in ${file}`, type: "error" });
    }
    lines.push({ text: "Automatic merge failed; fix conflicts and then commit the result.", type: "warning" });
    lines.push({
      text: "Hint: conflict markers <<<<<<< ======= >>>>>>> show both versions. Edit the file, then git add and git commit.",
      type: "hint",
    });
    return { lines };
  }

  // No conflicts — create merge commit
  const mergeId = generateId();
  const mergeCommitObj: CommitObject = {
    id: mergeId,
    message: `Merge branch '${targetBranch}' into ${currentBranch ?? "HEAD"}`,
    timestamp: Date.now(),
    parentId: currentCommitId,
    secondParentId: targetCommitId,
    snapshot: mergedSnapshot,
    branch: currentBranch ?? "detached",
  };

  state.commits.push(mergeCommitObj);

  if (currentBranch) {
    state.branches.set(currentBranch, mergeId);
  } else {
    state.head = mergeId;
  }

  state.workingDir = new Map(mergedSnapshot);
  state.stagingArea = new Map(mergedSnapshot);

  state.reflog.unshift({
    commitId: mergeId,
    action: "merge",
    message: `merge ${targetBranch}: Merge branch '${targetBranch}'`,
  });

  return {
    lines: [
      {
        text: `Merge made by the 'recursive' strategy.`,
        type: "success",
      },
      {
        text: `[${currentBranch ?? mergeId.slice(0, 7)} ${mergeId.slice(0, 7)}] Merge branch '${targetBranch}'`,
        type: "success",
      },
    ],
  };
}

// Helper: switch HEAD to a branch and restore working tree
function switchToBranch(state: EngineState, branchName: string): CommandOutput {
  const prevHead = state.head;
  state.head = branchName;
  state.isDetached = false;

  // Restore working dir and staging from the branch's commit snapshot
  const commitId = state.branches.get(branchName);
  if (commitId) {
    const commit = state.commits.find((c) => c.id === commitId);
    if (commit) {
      state.workingDir = new Map(commit.snapshot);
      state.stagingArea = new Map(commit.snapshot);
    }
  } else {
    // Branch exists but has no commits yet
    state.workingDir = new Map();
    state.stagingArea = new Map();
  }

  state.reflog.unshift({
    commitId: commitId ?? "",
    action: "checkout",
    message: `checkout: moving from ${prevHead} to ${branchName}`,
  });

  return {
    lines: [{ text: `Switched to branch '${branchName}'`, type: "success" }],
  };
}

// Helper: get all reachable commit IDs from a given starting commit
function getReachableCommitIds(state: EngineState, startId: string | null): Set<string> {
  const visited = new Set<string>();
  if (!startId) return visited;

  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const commit = state.commits.find((c) => c.id === id);
    if (commit) {
      if (commit.parentId) queue.push(commit.parentId);
      if (commit.secondParentId) queue.push(commit.secondParentId);
    }
  }
  return visited;
}

// Helper: get ordered list of reachable commits from a starting commit
function getReachableCommitList(state: EngineState, startId: string | null): CommitObject[] {
  const result: CommitObject[] = [];
  const visited = new Set<string>();
  if (!startId) return result;

  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const commit = state.commits.find((c) => c.id === id);
    if (commit) {
      result.push(commit);
      if (commit.parentId) queue.push(commit.parentId);
      if (commit.secondParentId) queue.push(commit.secondParentId);
    }
  }
  return result;
}
