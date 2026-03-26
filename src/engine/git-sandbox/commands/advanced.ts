import {
  EngineState,
  CommandOutput,
  ParsedCommand,
  CommitObject,
  generateId,
} from "../types";
import {
  getLastSnapshot,
  getCurrentCommitId,
  getCommitById,
  getReachableCommits,
} from "./basic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a ref string to a commit id.
 * Supports: branch names, commit id / prefix, HEAD, HEAD~N
 */
function resolveRef(state: EngineState, ref: string): string | null {
  // HEAD~N
  const headTildeMatch = ref.match(/^HEAD~(\d+)$/);
  if (headTildeMatch) {
    const n = parseInt(headTildeMatch[1], 10);
    let commitId = getCurrentCommitId(state);
    for (let i = 0; i < n; i++) {
      if (!commitId) return null;
      const commit = getCommitById(state, commitId);
      if (!commit || !commit.parentId) return null;
      commitId = commit.parentId;
    }
    return commitId;
  }

  if (ref === "HEAD") {
    return getCurrentCommitId(state);
  }

  // Branch name
  if (state.branches.has(ref)) {
    return state.branches.get(ref) || null;
  }

  // Commit id (or prefix)
  const commit = getCommitById(state, ref);
  if (commit) return commit.id;

  return null;
}

/**
 * Get all reachable commit ids from a starting commit (following parentId + secondParentId).
 */
function getReachableCommitIds(
  state: EngineState,
  startId: string | null,
): Set<string> {
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

// ---------------------------------------------------------------------------
// git reset
// ---------------------------------------------------------------------------

export function execReset(
  state: EngineState,
  cmd: ParsedCommand,
): CommandOutput {
  const soft = cmd.flags["soft"] === true;
  const hard = cmd.flags["hard"] === true;
  const mixed =
    cmd.flags["mixed"] === true || (!soft && !hard); // default mode

  const refArg = cmd.args[0] ?? "HEAD";
  const targetId = resolveRef(state, refArg);

  if (!targetId) {
    return {
      lines: [
        { text: `fatal: ambiguous argument '${refArg}': unknown revision`, type: "error" },
      ],
    };
  }

  const targetCommit = getCommitById(state, targetId);
  if (!targetCommit) {
    return {
      lines: [{ text: `fatal: Could not resolve '${refArg}'`, type: "error" }],
    };
  }

  // Move HEAD (branch pointer) to target
  const currentBranch = state.isDetached ? null : state.head;
  if (currentBranch) {
    state.branches.set(currentBranch, targetCommit.id);
  } else {
    state.head = targetCommit.id;
  }

  if (mixed || hard) {
    // Reset staging area to match target commit's snapshot
    state.stagingArea = new Map(targetCommit.snapshot);
  }

  if (hard) {
    // Reset working directory to match target commit's snapshot
    state.workingDir = new Map(targetCommit.snapshot);
  }

  // Add reflog entry
  state.reflog.unshift({
    commitId: targetCommit.id,
    action: "reset",
    message: `reset: moving to ${refArg}`,
  });

  const modeLabel = soft ? "--soft" : hard ? "--hard" : "--mixed";
  return {
    lines: [
      {
        text: `HEAD is now at ${targetCommit.id.slice(0, 7)} ${targetCommit.message}`,
        type: "success",
      },
      { text: `Reset mode: ${modeLabel}`, type: "info" },
    ],
  };
}

// ---------------------------------------------------------------------------
// git revert
// ---------------------------------------------------------------------------

export function execRevert(
  state: EngineState,
  cmd: ParsedCommand,
): CommandOutput {
  const ref = cmd.args[0];
  if (!ref) {
    return {
      lines: [{ text: "fatal: missing commit to revert", type: "error" }],
    };
  }

  const targetCommit = getCommitById(state, ref);
  if (!targetCommit) {
    return {
      lines: [
        {
          text: `fatal: bad revision '${ref}'`,
          type: "error",
        },
      ],
    };
  }

  // Get parent snapshot (empty if no parent)
  const parentSnapshot: Map<string, string> = targetCommit.parentId
    ? (getCommitById(state, targetCommit.parentId)?.snapshot ??
      new Map<string, string>())
    : new Map<string, string>();

  // Build inverse changes: for every file that changed between parent and target,
  // revert it in the current staging area / working dir.
  const currentSnapshot = new Map(state.stagingArea);

  // Files that were added by the target commit → remove them
  for (const [path, content] of targetCommit.snapshot) {
    if (!parentSnapshot.has(path)) {
      // File was added in target commit – remove it
      currentSnapshot.delete(path);
    } else if (parentSnapshot.get(path) !== content) {
      // File was modified in target commit – restore parent version
      currentSnapshot.set(path, parentSnapshot.get(path)!);
    }
  }

  // Files that were deleted in target commit → restore them
  for (const [path, content] of parentSnapshot) {
    if (!targetCommit.snapshot.has(path)) {
      currentSnapshot.set(path, content);
    }
  }

  // Create the revert commit
  const id = generateId();
  const currentBranch = state.isDetached ? null : state.head;
  const parentId = getCurrentCommitId(state);
  const message = `Revert: ${targetCommit.message}`;

  const commit: CommitObject = {
    id,
    message,
    timestamp: Date.now(),
    parentId,
    secondParentId: null,
    snapshot: new Map(currentSnapshot),
    branch: currentBranch ?? "detached",
  };

  state.commits.push(commit);

  if (currentBranch) {
    state.branches.set(currentBranch, id);
  } else {
    state.head = id;
  }

  state.workingDir = new Map(currentSnapshot);
  state.stagingArea = new Map(currentSnapshot);

  state.reflog.unshift({
    commitId: id,
    action: "revert",
    message: `revert: ${message}`,
  });

  return {
    lines: [
      {
        text: `[${currentBranch ?? id.slice(0, 7)} ${id.slice(0, 7)}] ${message}`,
        type: "success",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// git stash
// ---------------------------------------------------------------------------

export function execStash(
  state: EngineState,
  cmd: ParsedCommand,
): CommandOutput {
  const sub = cmd.args[0]; // pop | list | apply | undefined (= push)

  if (!sub || sub === "push") {
    return stashPush(state);
  }
  if (sub === "pop") {
    return stashPop(state);
  }
  if (sub === "list") {
    return stashList(state);
  }
  if (sub === "apply") {
    return stashApply(state);
  }

  return {
    lines: [
      { text: `error: unknown stash subcommand '${sub}'`, type: "error" },
    ],
  };
}

function stashPush(state: EngineState): CommandOutput {
  const lastSnapshot = getLastSnapshot(state);

  // Check if there are changes to stash
  const workDirDirty = !mapsEqual(state.workingDir, lastSnapshot);
  const stagingDirty = !mapsEqual(state.stagingArea, lastSnapshot);

  if (!workDirDirty && !stagingDirty) {
    return {
      lines: [
        { text: "No local changes to save", type: "warning" },
      ],
    };
  }

  // Save current state to stash
  state.stash.push({
    message: `WIP on ${state.head}`,
    workingDir: new Map(state.workingDir),
    stagingArea: new Map(state.stagingArea),
  });

  // Restore working dir + staging to last commit snapshot
  state.workingDir = new Map(lastSnapshot);
  state.stagingArea = new Map(lastSnapshot);

  return {
    lines: [
      {
        text: `Saved working directory and index state WIP on ${state.head}`,
        type: "success",
      },
    ],
  };
}

function stashPop(state: EngineState): CommandOutput {
  if (state.stash.length === 0) {
    return {
      lines: [{ text: "error: No stash entries found", type: "error" }],
    };
  }

  const entry = state.stash.pop()!;
  state.workingDir = new Map(entry.workingDir);
  state.stagingArea = new Map(entry.stagingArea);

  return {
    lines: [
      { text: `Restored changes from stash`, type: "success" },
      { text: `Dropped stash@{0}`, type: "info" },
    ],
  };
}

function stashApply(state: EngineState): CommandOutput {
  if (state.stash.length === 0) {
    return {
      lines: [{ text: "error: No stash entries found", type: "error" }],
    };
  }

  const entry = state.stash[state.stash.length - 1];
  state.workingDir = new Map(entry.workingDir);
  state.stagingArea = new Map(entry.stagingArea);

  return {
    lines: [{ text: `Applied stash@{0}`, type: "success" }],
  };
}

function stashList(state: EngineState): CommandOutput {
  if (state.stash.length === 0) {
    return { lines: [{ text: "No stash entries", type: "info" }] };
  }

  const lines: CommandOutput["lines"] = [];
  for (let i = state.stash.length - 1; i >= 0; i--) {
    const idx = state.stash.length - 1 - i;
    lines.push({
      text: `stash@{${idx}}: ${state.stash[i].message}`,
      type: "info",
    });
  }
  return { lines };
}

// ---------------------------------------------------------------------------
// git reflog
// ---------------------------------------------------------------------------

export function execReflog(
  state: EngineState,
  _cmd: ParsedCommand,
): CommandOutput {
  if (state.reflog.length === 0) {
    return { lines: [{ text: "No reflog entries", type: "info" }] };
  }

  const lines: CommandOutput["lines"] = state.reflog.map((entry, i) => ({
    text: `${entry.commitId.slice(0, 7)} HEAD@{${i}} ${entry.action}: ${entry.message}`,
    type: "info" as const,
  }));

  return { lines };
}

// ---------------------------------------------------------------------------
// git cherry-pick
// ---------------------------------------------------------------------------

export function execCherryPick(
  state: EngineState,
  cmd: ParsedCommand,
): CommandOutput {
  const ref = cmd.args[0];
  if (!ref) {
    return {
      lines: [
        { text: "fatal: missing commit to cherry-pick", type: "error" },
      ],
    };
  }

  const targetCommit = getCommitById(state, ref);
  if (!targetCommit) {
    return {
      lines: [{ text: `fatal: bad revision '${ref}'`, type: "error" }],
    };
  }

  // Compute diff between target and its parent
  const parentSnapshot: Map<string, string> = targetCommit.parentId
    ? (getCommitById(state, targetCommit.parentId)?.snapshot ??
      new Map<string, string>())
    : new Map<string, string>();

  // Apply those changes on top of current staging area
  const currentSnapshot = new Map(state.stagingArea);

  // Files added or modified in target commit relative to its parent
  for (const [path, content] of targetCommit.snapshot) {
    const parentContent = parentSnapshot.get(path);
    if (parentContent === undefined || parentContent !== content) {
      // Added or modified → apply to current
      currentSnapshot.set(path, content);
    }
  }

  // Files deleted in target commit relative to its parent
  for (const path of parentSnapshot.keys()) {
    if (!targetCommit.snapshot.has(path)) {
      currentSnapshot.delete(path);
    }
  }

  // Create new commit
  const id = generateId();
  const currentBranch = state.isDetached ? null : state.head;
  const parentId = getCurrentCommitId(state);

  const commit: CommitObject = {
    id,
    message: targetCommit.message,
    timestamp: Date.now(),
    parentId,
    secondParentId: null,
    snapshot: new Map(currentSnapshot),
    branch: currentBranch ?? "detached",
  };

  state.commits.push(commit);

  if (currentBranch) {
    state.branches.set(currentBranch, id);
  } else {
    state.head = id;
  }

  state.workingDir = new Map(currentSnapshot);
  state.stagingArea = new Map(currentSnapshot);

  state.reflog.unshift({
    commitId: id,
    action: "cherry-pick",
    message: `cherry-pick: ${targetCommit.message}`,
  });

  return {
    lines: [
      {
        text: `[${currentBranch ?? id.slice(0, 7)} ${id.slice(0, 7)}] ${targetCommit.message}`,
        type: "success",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// git rebase
// ---------------------------------------------------------------------------

export function execRebase(
  state: EngineState,
  cmd: ParsedCommand,
): CommandOutput {
  const targetBranch = cmd.args[0];
  if (!targetBranch) {
    return {
      lines: [
        { text: "fatal: missing branch name for rebase", type: "error" },
      ],
    };
  }

  if (!state.branches.has(targetBranch)) {
    return {
      lines: [
        {
          text: `fatal: invalid upstream '${targetBranch}'`,
          type: "error",
        },
      ],
    };
  }

  const currentBranch = state.isDetached ? null : state.head;
  if (!currentBranch) {
    return {
      lines: [
        { text: "fatal: cannot rebase in detached HEAD state", type: "error" },
      ],
    };
  }

  const currentCommitId = getCurrentCommitId(state);
  const targetCommitId = state.branches.get(targetBranch)!;

  if (!currentCommitId || !targetCommitId) {
    return {
      lines: [{ text: "fatal: no commits to rebase", type: "error" }],
    };
  }

  if (currentCommitId === targetCommitId) {
    return {
      lines: [
        {
          text: `Current branch ${currentBranch} is up to date.`,
          type: "info",
        },
      ],
    };
  }

  // Find commits reachable from target branch
  const targetReachable = getReachableCommitIds(state, targetCommitId);

  // If current is already ancestor of target, fast-forward
  if (targetReachable.has(currentCommitId)) {
    return {
      lines: [
        {
          text: `Current branch ${currentBranch} is up to date.`,
          type: "info",
        },
      ],
    };
  }

  // Gather commits on current branch that are NOT in target branch's history
  // Walk from current commit back, stop when we reach a commit in targetReachable
  const commitsToReplay: CommitObject[] = [];
  let walkId: string | null = currentCommitId;
  while (walkId) {
    if (targetReachable.has(walkId)) break;
    const commit = getCommitById(state, walkId);
    if (!commit) break;
    commitsToReplay.push(commit);
    walkId = commit.parentId;
  }

  // Reverse so we replay in chronological order (oldest first)
  commitsToReplay.reverse();

  // Replay each commit onto target branch tip
  let newParentId = targetCommitId;
  let newParentSnapshot =
    getCommitById(state, targetCommitId)?.snapshot ?? new Map<string, string>();

  for (const original of commitsToReplay) {
    // Compute what original commit changed relative to its parent
    const origParentSnapshot: Map<string, string> = original.parentId
      ? (getCommitById(state, original.parentId)?.snapshot ??
        new Map<string, string>())
      : new Map<string, string>();

    // Start from new parent snapshot, apply the diff
    const newSnapshot = new Map(newParentSnapshot);

    // Added or modified files
    for (const [path, content] of original.snapshot) {
      const origParentContent = origParentSnapshot.get(path);
      if (origParentContent === undefined || origParentContent !== content) {
        newSnapshot.set(path, content);
      }
    }

    // Deleted files
    for (const path of origParentSnapshot.keys()) {
      if (!original.snapshot.has(path)) {
        newSnapshot.delete(path);
      }
    }

    const newId = generateId();
    const newCommit: CommitObject = {
      id: newId,
      message: original.message,
      timestamp: Date.now(),
      parentId: newParentId,
      secondParentId: null,
      snapshot: newSnapshot,
      branch: currentBranch,
    };

    state.commits.push(newCommit);
    newParentId = newId;
    newParentSnapshot = newSnapshot;
  }

  // Move current branch pointer to the new tip
  state.branches.set(currentBranch, newParentId);

  // Update working dir + staging
  state.workingDir = new Map(newParentSnapshot);
  state.stagingArea = new Map(newParentSnapshot);

  // Add reflog entry
  state.reflog.unshift({
    commitId: newParentId,
    action: "rebase",
    message: `rebase finished: ${currentBranch} onto ${targetBranch}`,
  });

  return {
    lines: [
      {
        text: `Successfully rebased ${currentBranch} onto ${targetBranch}.`,
        type: "success",
      },
      {
        text: `Replayed ${commitsToReplay.length} commit(s).`,
        type: "info",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Private helper
// ---------------------------------------------------------------------------

function mapsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, val] of a) {
    if (b.get(key) !== val) return false;
  }
  return true;
}
