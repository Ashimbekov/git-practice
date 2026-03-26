import { EngineState, CommandOutput, ParsedCommand, RemoteState, CommitObject } from "../types";
import { execMerge } from "./branch";

// ---------------------------------------------------------------------------
// git remote
// ---------------------------------------------------------------------------

export function execRemote(state: EngineState, cmd: ParsedCommand): CommandOutput {
  // git remote -v
  if (cmd.flags["v"] === true) {
    if (state.remotes.size === 0) {
      return { lines: [{ text: "No remotes configured", type: "info" }] };
    }
    const lines: CommandOutput["lines"] = [];
    for (const [name] of state.remotes) {
      lines.push({ text: `${name}\t${name} (fetch)`, type: "info" });
      lines.push({ text: `${name}\t${name} (push)`, type: "info" });
    }
    return { lines };
  }

  // git remote add <name> <url>
  if (cmd.args[0] === "add") {
    const name = cmd.args[1];
    const url = cmd.args[2];
    if (!name || !url) {
      return {
        lines: [{ text: "usage: git remote add <name> <url>", type: "error" }],
      };
    }
    if (state.remotes.has(name)) {
      return {
        lines: [{ text: `fatal: remote '${name}' already exists`, type: "error" }],
      };
    }
    const remoteState: RemoteState = {
      branches: new Map(),
      commits: [],
    };
    state.remotes.set(name, remoteState);
    return { lines: [{ text: `Remote '${name}' added`, type: "success" }] };
  }

  // git remote remove <name>
  if (cmd.args[0] === "remove") {
    const name = cmd.args[1];
    if (!name) {
      return {
        lines: [{ text: "usage: git remote remove <name>", type: "error" }],
      };
    }
    if (!state.remotes.has(name)) {
      return {
        lines: [{ text: `fatal: No such remote: '${name}'`, type: "error" }],
      };
    }
    state.remotes.delete(name);
    // Also remove tracking branches like origin/main
    for (const branchName of [...state.branches.keys()]) {
      if (branchName.startsWith(`${name}/`)) {
        state.branches.delete(branchName);
      }
    }
    return { lines: [{ text: `Remote '${name}' removed`, type: "success" }] };
  }

  // git remote (no args) — list remote names
  if (cmd.args.length === 0) {
    if (state.remotes.size === 0) {
      return { lines: [] };
    }
    const lines: CommandOutput["lines"] = [];
    for (const [name] of state.remotes) {
      lines.push({ text: name, type: "info" });
    }
    return { lines };
  }

  return {
    lines: [{ text: `git: remote subcommand '${cmd.args[0]}' is not supported`, type: "error" }],
  };
}

// ---------------------------------------------------------------------------
// git push
// ---------------------------------------------------------------------------

export function execPush(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const remoteName = cmd.args[0];
  const branchName = cmd.args[1];

  if (!remoteName || !branchName) {
    return {
      lines: [{ text: "usage: git push <remote> <branch>", type: "error" }],
    };
  }

  const remote = state.remotes.get(remoteName);
  if (!remote) {
    return {
      lines: [{ text: `fatal: '${remoteName}' does not appear to be a git repository`, type: "error" }],
    };
  }

  if (!state.branches.has(branchName)) {
    return {
      lines: [{ text: `error: src refspec '${branchName}' does not match any`, type: "error" }],
    };
  }

  // Collect all commits reachable from the branch
  const headCommitId = state.branches.get(branchName)!;
  if (!headCommitId) {
    return {
      lines: [{ text: `error: branch '${branchName}' has no commits`, type: "error" }],
    };
  }

  // Walk commits reachable from this branch
  const reachable = getReachableCommitsFromId(state.commits, headCommitId);

  // Determine which commits are new (not already in remote)
  const remoteCommitIds = new Set(remote.commits.map((c) => c.id));
  const newCommits = reachable.filter((c) => !remoteCommitIds.has(c.id));

  // Add new commits to remote (in chronological order — oldest first)
  for (const commit of newCommits.reverse()) {
    remote.commits.push(commit);
  }

  // Update remote branch pointer
  remote.branches.set(branchName, headCommitId);

  // Update local tracking branch (e.g. origin/main)
  state.branches.set(`${remoteName}/${branchName}`, headCommitId);

  const count = newCommits.length;
  return {
    lines: [
      {
        text: `Отправлено ${count} коммит(ов) в ${remoteName}/${branchName}`,
        type: "success",
      },
      {
        text: `Branch '${branchName}' set up to track remote branch '${branchName}' from '${remoteName}'.`,
        type: "info",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// git fetch
// ---------------------------------------------------------------------------

export function execFetch(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const remoteName = cmd.args[0];

  if (!remoteName) {
    return {
      lines: [{ text: "usage: git fetch <remote>", type: "error" }],
    };
  }

  const remote = state.remotes.get(remoteName);
  if (!remote) {
    return {
      lines: [{ text: `fatal: '${remoteName}' does not appear to be a git repository`, type: "error" }],
    };
  }

  // Copy remote commits into local commits array if not already present
  const localCommitIds = new Set(state.commits.map((c) => c.id));
  let newCount = 0;

  for (const remoteCommit of remote.commits) {
    if (!localCommitIds.has(remoteCommit.id)) {
      state.commits.push(remoteCommit);
      newCount++;
    }
  }

  // Create/update tracking branches (e.g. origin/main)
  for (const [branch, commitId] of remote.branches) {
    state.branches.set(`${remoteName}/${branch}`, commitId);
  }

  return {
    lines: [
      {
        text: `Получено ${newCount} новых коммит(ов) из ${remoteName}`,
        type: newCount > 0 ? "success" : "info",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// git pull
// ---------------------------------------------------------------------------

export function execPull(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const remoteName = cmd.args[0];
  const branchName = cmd.args[1];

  if (!remoteName || !branchName) {
    return {
      lines: [{ text: "usage: git pull <remote> <branch>", type: "error" }],
    };
  }

  const remote = state.remotes.get(remoteName);
  if (!remote) {
    return {
      lines: [{ text: `fatal: '${remoteName}' does not appear to be a git repository`, type: "error" }],
    };
  }

  // Step 1: fetch
  const fetchCmd: ParsedCommand = {
    raw: `git fetch ${remoteName}`,
    program: "git",
    subcommand: "fetch",
    args: [remoteName],
    flags: {},
  };
  const fetchResult = execFetch(state, fetchCmd);

  // Step 2: merge the tracking branch into current branch
  const trackingBranch = `${remoteName}/${branchName}`;
  if (!state.branches.has(trackingBranch)) {
    return {
      lines: [
        ...fetchResult.lines,
        { text: `fatal: couldn't find remote ref ${branchName}`, type: "error" },
      ],
    };
  }

  const mergeCmd: ParsedCommand = {
    raw: `git merge ${trackingBranch}`,
    program: "git",
    subcommand: "merge",
    args: [trackingBranch],
    flags: {},
  };
  const mergeResult = execMerge(state, mergeCmd);

  return {
    lines: [...fetchResult.lines, ...mergeResult.lines],
  };
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function getReachableCommitsFromId(
  allCommits: CommitObject[],
  startId: string
): CommitObject[] {
  const result: CommitObject[] = [];
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const id = queue.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const commit = allCommits.find((c) => c.id === id);
    if (commit) {
      result.push(commit);
      if (commit.parentId) queue.push(commit.parentId);
      if (commit.secondParentId) queue.push(commit.secondParentId);
    }
  }

  return result;
}
