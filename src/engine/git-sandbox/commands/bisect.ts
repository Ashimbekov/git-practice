import { EngineState, CommandOutput, ParsedCommand, CommitObject } from "../types";
import { getCurrentCommitId, getCommitById } from "./basic";

export function execBisect(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const sub = cmd.args[0];

  if (sub === "start") return bisectStart(state);
  if (sub === "bad") return bisectBad(state, cmd.args[1]);
  if (sub === "good") return bisectGood(state, cmd.args[1]);
  if (sub === "reset") return bisectReset(state);

  return {
    lines: [{ text: `error: unknown bisect subcommand '${sub ?? ""}'`, type: "error" }],
  };
}

function bisectStart(state: EngineState): CommandOutput {
  state.bisect = {
    active: true,
    goodCommits: [],
    badCommits: [],
    originalHead: state.head,
    originalIsDetached: state.isDetached,
  };
  return {
    lines: [{ text: "Bisecting: start", type: "success" }],
  };
}

function bisectBad(state: EngineState, ref?: string): CommandOutput {
  if (!state.bisect?.active) {
    return { lines: [{ text: "error: bisect not started — run git bisect start", type: "error" }] };
  }

  let commitId: string | null;
  if (ref) {
    const commit = getCommitById(state, ref);
    if (!commit) {
      return { lines: [{ text: `fatal: bad revision '${ref}'`, type: "error" }] };
    }
    commitId = commit.id;
  } else {
    commitId = getCurrentCommitId(state);
    if (!commitId) {
      return { lines: [{ text: "fatal: no commits", type: "error" }] };
    }
  }

  if (!state.bisect.badCommits.includes(commitId)) {
    state.bisect.badCommits.push(commitId);
  }

  return tryCheckoutMidpoint(state);
}

function bisectGood(state: EngineState, ref?: string): CommandOutput {
  if (!state.bisect?.active) {
    return { lines: [{ text: "error: bisect not started — run git bisect start", type: "error" }] };
  }

  let commitId: string | null;
  if (ref) {
    const commit = getCommitById(state, ref);
    if (!commit) {
      return { lines: [{ text: `fatal: bad revision '${ref}'`, type: "error" }] };
    }
    commitId = commit.id;
  } else {
    commitId = getCurrentCommitId(state);
    if (!commitId) {
      return { lines: [{ text: "fatal: no commits", type: "error" }] };
    }
  }

  if (!state.bisect.goodCommits.includes(commitId)) {
    state.bisect.goodCommits.push(commitId);
  }

  return tryCheckoutMidpoint(state);
}

function tryCheckoutMidpoint(state: EngineState): CommandOutput {
  const bisect = state.bisect!;
  if (bisect.badCommits.length === 0 || bisect.goodCommits.length === 0) {
    return {
      lines: [{ text: "Bisecting: waiting for both good and bad commits", type: "success" }],
    };
  }

  const badId = bisect.badCommits[bisect.badCommits.length - 1];
  const linearCommits = getLinearCommitsFrom(state, badId);

  const goodSet = new Set(bisect.goodCommits);
  const candidates: string[] = [];

  for (const commit of linearCommits) {
    if (goodSet.has(commit.id)) break;
    candidates.push(commit.id);
  }

  if (candidates.length <= 1) {
    const foundId = candidates[0] ?? badId;
    const foundCommit = getCommitById(state, foundId);
    const msg = foundCommit ? foundCommit.message : foundId.slice(0, 7);
    return {
      lines: [
        { text: `${foundId.slice(0, 7)} is the first bad commit`, type: "warning" },
        { text: `commit: ${msg}`, type: "info" },
      ],
    };
  }

  const midIndex = Math.floor(candidates.length / 2);
  const midId = candidates[midIndex];
  const midCommit = getCommitById(state, midId);

  state.isDetached = true;
  state.head = midId;
  if (midCommit) {
    state.workingDir = new Map(midCommit.snapshot);
    state.stagingArea = new Map(midCommit.snapshot);
  }

  return {
    lines: [
      { text: `Bisecting: ${candidates.length - 1} revisions left to test`, type: "success" },
      { text: `[${midId.slice(0, 7)}] ${midCommit?.message ?? ""}`, type: "info" },
    ],
  };
}

function bisectReset(state: EngineState): CommandOutput {
  if (!state.bisect?.active) {
    return { lines: [{ text: "error: no bisect session active", type: "error" }] };
  }

  const { originalHead, originalIsDetached } = state.bisect;
  state.bisect = null;
  state.head = originalHead;
  state.isDetached = originalIsDetached;

  if (!originalIsDetached) {
    const branchCommitId = state.branches.get(originalHead);
    if (branchCommitId) {
      const commit = getCommitById(state, branchCommitId);
      if (commit) {
        state.workingDir = new Map(commit.snapshot);
        state.stagingArea = new Map(commit.snapshot);
      }
    }
  }

  return {
    lines: [{ text: `Bisect reset. Back to ${originalHead}`, type: "success" }],
  };
}

function getLinearCommitsFrom(state: EngineState, startId: string): CommitObject[] {
  const result: CommitObject[] = [];
  let currentId: string | null = startId;
  while (currentId) {
    const commit = state.commits.find((c) => c.id === currentId);
    if (!commit) break;
    result.push(commit);
    currentId = commit.parentId;
  }
  return result;
}
