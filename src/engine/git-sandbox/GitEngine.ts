import { EngineState, CommandOutput, CommitObject, RemoteState, StashedState } from "./types";
import { parseCommand } from "./parser";
import { executeCommand } from "./commands";

export class GitEngine {
  state: EngineState;
  history: string[];

  constructor() {
    this.state = createEmptyState();
    this.history = [];
  }

  execute(input: string): CommandOutput {
    const trimmed = input.trim();
    if (!trimmed) {
      return { lines: [] };
    }

    this.history.push(trimmed);
    const cmd = parseCommand(trimmed);
    return executeCommand(this.state, cmd);
  }

  getGraphData() {
    const commits: Array<{
      id: string;
      message: string;
      branch: string;
      parent?: string;
      secondParent?: string;
    }> = [];

    for (const commit of this.state.commits) {
      commits.push({
        id: commit.id,
        message: commit.message,
        branch: commit.branch,
        parent: commit.parentId ?? undefined,
        secondParent: commit.secondParentId ?? undefined,
      });
    }

    const branches: Array<{ name: string; commitId: string; color: string }> = [];
    const colors = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444", "#a855f7", "#ec4899", "#14b8a6"];
    let colorIdx = 0;

    for (const [name, commitId] of this.state.branches) {
      branches.push({
        name,
        commitId,
        color: colors[colorIdx % colors.length],
      });
      colorIdx++;
    }

    const tags: Array<{ name: string; commitId: string }> = [];
    for (const [name, commitId] of this.state.tags) {
      tags.push({ name, commitId });
    }

    return {
      commits,
      branches,
      tags,
      head: this.state.head,
    };
  }

  getFiles() {
    return {
      working: [...this.state.workingDir.entries()].map(([path, content]) => ({ path, content })),
      staging: [...this.state.stagingArea.entries()].map(([path, content]) => ({ path, content })),
    };
  }

  getCompletions(partial: string): string[] {
    const completions: string[] = [];

    if (!partial) return completions;

    // Git commands
    const gitCmds = ["git init", "git add", "git commit", "git status", "git log", "git diff",
      "git branch", "git switch", "git checkout", "git merge", "git rebase", "git cherry-pick",
      "git reset", "git revert", "git stash", "git reflog", "git remote", "git push", "git pull", "git fetch",
      "git tag", "git blame", "git bisect"];
    const shellCmds = ["echo", "cat", "ls", "rm"];
    const allCmds = [...gitCmds, ...shellCmds];

    for (const cmd of allCmds) {
      if (cmd.startsWith(partial)) {
        completions.push(cmd);
      }
    }

    // File completions
    if (partial.includes(" ")) {
      const lastWord = partial.split(" ").pop() ?? "";
      for (const path of this.state.workingDir.keys()) {
        if (path.startsWith(lastWord)) {
          completions.push(partial.slice(0, partial.lastIndexOf(" ") + 1) + path);
        }
      }
      // Branch completions
      for (const name of this.state.branches.keys()) {
        if (name.startsWith(lastWord)) {
          completions.push(partial.slice(0, partial.lastIndexOf(" ") + 1) + name);
        }
      }
    }

    return completions;
  }

  reset() {
    this.state = createEmptyState();
    this.history = [];
  }

  serialize(): string {
    return JSON.stringify({
      state: serializeState(this.state),
      history: this.history,
    });
  }

  static deserialize(json: string): GitEngine {
    const data = JSON.parse(json);
    const engine = new GitEngine();
    engine.state = deserializeState(data.state);
    engine.history = data.history;
    return engine;
  }
}

function createEmptyState(): EngineState {
  return {
    initialized: false,
    workingDir: new Map(),
    stagingArea: new Map(),
    commits: [],
    branches: new Map(),
    head: "main",
    isDetached: false,
    remotes: new Map(),
    stash: [],
    reflog: [],
    conflictFiles: new Map(),
    tags: new Map(),
    bisect: null,
  };
}

function serializeCommit(commit: CommitObject) {
  return {
    ...commit,
    snapshot: [...commit.snapshot.entries()],
  };
}

function deserializeCommit(raw: ReturnType<typeof serializeCommit>): CommitObject {
  return {
    ...raw,
    snapshot: new Map(raw.snapshot),
  };
}

function serializeRemoteState(remote: RemoteState) {
  return {
    branches: [...remote.branches.entries()],
    commits: remote.commits.map(serializeCommit),
  };
}

function deserializeRemoteState(raw: ReturnType<typeof serializeRemoteState>): RemoteState {
  return {
    branches: new Map(raw.branches),
    commits: raw.commits.map(deserializeCommit),
  };
}

function serializeStash(stash: StashedState) {
  return {
    message: stash.message,
    workingDir: [...stash.workingDir.entries()],
    stagingArea: [...stash.stagingArea.entries()],
  };
}

function deserializeStash(raw: ReturnType<typeof serializeStash>): StashedState {
  return {
    message: raw.message,
    workingDir: new Map(raw.workingDir),
    stagingArea: new Map(raw.stagingArea),
  };
}

function serializeState(state: EngineState) {
  return {
    ...state,
    workingDir: [...state.workingDir.entries()],
    stagingArea: [...state.stagingArea.entries()],
    commits: state.commits.map(serializeCommit),
    branches: [...state.branches.entries()],
    remotes: [...state.remotes.entries()].map(([name, remote]) => [name, serializeRemoteState(remote)]),
    stash: state.stash.map(serializeStash),
    conflictFiles: [...state.conflictFiles.entries()],
    tags: [...state.tags.entries()],
  };
}

function deserializeState(raw: ReturnType<typeof serializeState>): EngineState {
  return {
    ...raw,
    workingDir: new Map(raw.workingDir),
    stagingArea: new Map(raw.stagingArea),
    commits: raw.commits.map(deserializeCommit),
    branches: new Map(raw.branches),
    remotes: new Map(
      (raw.remotes as Array<[string, ReturnType<typeof serializeRemoteState>]>).map(
        ([name, remote]) => [name, deserializeRemoteState(remote)]
      )
    ),
    stash: raw.stash.map(deserializeStash),
    conflictFiles: new Map(raw.conflictFiles as Array<[string, { ours: string; theirs: string }]>),
    tags: new Map(raw.tags),
  };
}
