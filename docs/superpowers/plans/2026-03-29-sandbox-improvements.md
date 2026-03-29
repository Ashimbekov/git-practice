# Sandbox Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the GitEngine sandbox with new commands (tag, blame, bisect), localStorage persistence, and level integration (presets, validators, SandboxChallenge).

**Architecture:** All changes build on the existing `GitEngine` class. New commands follow the established pattern in `commands/`. Serialization is added directly to `GitEngine`. Level integration uses lazy-loaded `preset.ts`/`validator.ts` files per level, and a new `SandboxChallenge` component replaces the self-report `Challenge` on the challenge step.

**Tech Stack:** TypeScript, React 19, Next.js 16, Framer Motion, Jest

---

### Task 1: Add `tags` and `bisect` fields to EngineState

**Files:**
- Modify: `src/engine/git-sandbox/types.ts`
- Modify: `src/engine/git-sandbox/commands/basic.ts` (execInit reset)
- Modify: `src/engine/git-sandbox/GitEngine.ts` (createEmptyState)

- [ ] **Step 1: Add new types to `types.ts`**

In `src/engine/git-sandbox/types.ts`, add the `BisectState` interface after `ReflogEntry` and update `EngineState`:

```ts
export interface BisectState {
  active: boolean;
  goodCommits: string[];
  badCommits: string[];
  originalHead: string;
  originalIsDetached: boolean;
}
```

Add to `EngineState`:

```ts
export interface EngineState {
  // ... existing fields ...
  tags: Map<string, string>;
  bisect: BisectState | null;
}
```

- [ ] **Step 2: Update `createEmptyState` in `GitEngine.ts`**

Add to the return value in `createEmptyState()`:

```ts
tags: new Map(),
bisect: null,
```

- [ ] **Step 3: Update `execInit` in `commands/basic.ts`**

Add to the `execInit` function body (after `state.conflictFiles = new Map();`):

```ts
state.tags = new Map();
state.bisect = null;
```

- [ ] **Step 4: Run existing tests to verify nothing broke**

Run: `npx jest --verbose 2>&1 | tail -20`
Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/git-sandbox/types.ts src/engine/git-sandbox/GitEngine.ts src/engine/git-sandbox/commands/basic.ts
git commit -m "feat(engine): add tags and bisect fields to EngineState"
```

---

### Task 2: Implement `git tag`

**Files:**
- Create: `src/engine/git-sandbox/commands/tag.ts`
- Create: `src/engine/git-sandbox/__tests__/tag.test.ts`
- Modify: `src/engine/git-sandbox/commands/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/engine/git-sandbox/__tests__/tag.test.ts`:

```ts
import { GitEngine } from "../GitEngine";

describe("git tag", () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "initial" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "initial commit"');
  });

  test("creates a lightweight tag at HEAD", () => {
    const result = engine.execute("git tag v1.0");
    expect(result.lines[0].type).toBe("success");
    expect(engine.state.tags.has("v1.0")).toBe(true);
    const headCommitId = engine.state.branches.get("main")!;
    expect(engine.state.tags.get("v1.0")).toBe(headCommitId);
  });

  test("creates a tag at specific commit", () => {
    const firstCommitId = engine.state.commits[0].id;
    engine.execute('echo "second" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "second commit"');

    const result = engine.execute(`git tag v0.1 ${firstCommitId}`);
    expect(result.lines[0].type).toBe("success");
    expect(engine.state.tags.get("v0.1")).toBe(firstCommitId);
  });

  test("lists all tags", () => {
    engine.execute("git tag v1.0");
    engine.execute("git tag v2.0");
    const result = engine.execute("git tag");
    const texts = result.lines.map((l) => l.text);
    expect(texts).toContain("v1.0");
    expect(texts).toContain("v2.0");
  });

  test("lists empty when no tags", () => {
    const result = engine.execute("git tag");
    expect(result.lines[0].text).toContain("No tags");
  });

  test("deletes a tag with -d", () => {
    engine.execute("git tag v1.0");
    const result = engine.execute("git tag -d v1.0");
    expect(result.lines[0].type).toBe("success");
    expect(engine.state.tags.has("v1.0")).toBe(false);
  });

  test("errors when deleting nonexistent tag", () => {
    const result = engine.execute("git tag -d nonexistent");
    expect(result.lines[0].type).toBe("error");
  });

  test("errors when creating duplicate tag", () => {
    engine.execute("git tag v1.0");
    const result = engine.execute("git tag v1.0");
    expect(result.lines[0].type).toBe("error");
  });

  test("errors when tagging nonexistent commit", () => {
    const result = engine.execute("git tag v1.0 nonexistent");
    expect(result.lines[0].type).toBe("error");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tag.test.ts --verbose 2>&1 | tail -20`
Expected: FAIL — `execTag` not found.

- [ ] **Step 3: Implement `git tag`**

Create `src/engine/git-sandbox/commands/tag.ts`:

```ts
import { EngineState, CommandOutput, ParsedCommand } from "../types";
import { getCurrentCommitId, getCommitById } from "./basic";

export function execTag(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const isDelete = cmd.flags["d"] === true;

  // git tag -d <name>
  if (isDelete) {
    const name = cmd.args[0];
    if (!name) {
      return { lines: [{ text: "fatal: tag name required", type: "error" }] };
    }
    if (!state.tags.has(name)) {
      return { lines: [{ text: `error: tag '${name}' not found`, type: "error" }] };
    }
    state.tags.delete(name);
    return { lines: [{ text: `Deleted tag '${name}'`, type: "success" }] };
  }

  // git tag (list)
  if (cmd.args.length === 0) {
    if (state.tags.size === 0) {
      return { lines: [{ text: "No tags", type: "info" }] };
    }
    const lines: CommandOutput["lines"] = [];
    for (const name of [...state.tags.keys()].sort()) {
      lines.push({ text: name, type: "info" });
    }
    return { lines };
  }

  // git tag <name> [commit]
  const name = cmd.args[0];
  if (state.tags.has(name)) {
    return { lines: [{ text: `fatal: tag '${name}' already exists`, type: "error" }] };
  }

  let commitId: string | null;
  if (cmd.args[1]) {
    const commit = getCommitById(state, cmd.args[1]);
    if (!commit) {
      return { lines: [{ text: `fatal: not a valid object name: '${cmd.args[1]}'`, type: "error" }] };
    }
    commitId = commit.id;
  } else {
    commitId = getCurrentCommitId(state);
    if (!commitId) {
      return { lines: [{ text: "fatal: no commits to tag", type: "error" }] };
    }
  }

  state.tags.set(name, commitId);
  return { lines: [{ text: `Created tag '${name}' at ${commitId.slice(0, 7)}`, type: "success" }] };
}
```

- [ ] **Step 4: Register in `commands/index.ts`**

Add import:
```ts
import { execTag } from "./tag";
```

Add to `gitCommands` record:
```ts
tag: execTag,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tag.test.ts --verbose 2>&1 | tail -30`
Expected: All 8 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/git-sandbox/commands/tag.ts src/engine/git-sandbox/__tests__/tag.test.ts src/engine/git-sandbox/commands/index.ts
git commit -m "feat(engine): implement git tag command"
```

---

### Task 3: Implement `git blame`

**Files:**
- Create: `src/engine/git-sandbox/commands/blame.ts`
- Create: `src/engine/git-sandbox/__tests__/blame.test.ts`
- Modify: `src/engine/git-sandbox/commands/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/engine/git-sandbox/__tests__/blame.test.ts`:

```ts
import { GitEngine } from "../GitEngine";

describe("git blame", () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "line1" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "first commit"');
  });

  test("shows blame for each line", () => {
    const result = engine.execute("git blame file.txt");
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].text).toContain("first commit");
    expect(result.lines[0].text).toContain("You");
  });

  test("tracks changes across multiple commits", () => {
    engine.execute('echo "line1\\nline2" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "add line2"');

    const result = engine.execute("git blame file.txt");
    expect(result.lines.length).toBe(2);
    // line1 from first commit
    expect(result.lines[0].text).toContain("first commit");
    // line2 from second commit
    expect(result.lines[1].text).toContain("add line2");
  });

  test("errors on nonexistent file", () => {
    const result = engine.execute("git blame nonexistent.txt");
    expect(result.lines[0].type).toBe("error");
  });

  test("errors when no file specified", () => {
    const result = engine.execute("git blame");
    expect(result.lines[0].type).toBe("error");
  });

  test("errors when no commits exist", () => {
    const freshEngine = new GitEngine();
    freshEngine.execute("git init");
    freshEngine.execute('echo "hello" > file.txt');
    const result = freshEngine.execute("git blame file.txt");
    expect(result.lines[0].type).toBe("error");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest blame.test.ts --verbose 2>&1 | tail -20`
Expected: FAIL.

- [ ] **Step 3: Implement `git blame`**

Create `src/engine/git-sandbox/commands/blame.ts`:

```ts
import { EngineState, CommandOutput, ParsedCommand, CommitObject } from "../types";
import { getReachableCommits } from "./basic";

export function execBlame(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const filePath = cmd.args[0];
  if (!filePath) {
    return { lines: [{ text: "fatal: no file specified", type: "error" }] };
  }

  const commits = getReachableCommits(state);
  if (commits.length === 0) {
    return { lines: [{ text: "fatal: no commits yet", type: "error" }] };
  }

  const headCommit = commits[0];
  const fileContent = headCommit.snapshot.get(filePath);
  if (fileContent === undefined) {
    return { lines: [{ text: `fatal: no such path '${filePath}' in HEAD`, type: "error" }] };
  }

  const currentLines = fileContent.split("\n");
  const blameResult = blameLines(currentLines, filePath, commits);

  const lines: CommandOutput["lines"] = blameResult.map((b, i) => ({
    text: `${b.commitId.slice(0, 7)} (You  ${b.message.padEnd(20).slice(0, 20)}) ${i + 1}) ${b.line}`,
    type: "info" as const,
  }));

  return { lines };
}

interface BlameLine {
  commitId: string;
  message: string;
  line: string;
}

function blameLines(
  currentLines: string[],
  filePath: string,
  commits: CommitObject[]
): BlameLine[] {
  // For each line in the current file, find which commit last changed it
  // commits are in reverse chronological order (newest first)
  const result: BlameLine[] = currentLines.map((line) => ({
    commitId: commits[0].id,
    message: commits[0].message,
    line,
  }));

  for (let lineIdx = 0; lineIdx < currentLines.length; lineIdx++) {
    const targetLine = currentLines[lineIdx];

    // Walk from newest to oldest, find when this line first appeared
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const content = commit.snapshot.get(filePath);
      const commitLines = content ? content.split("\n") : [];

      if (!commitLines.includes(targetLine)) {
        // This line didn't exist in this commit, so the previous (newer) commit introduced it
        if (i > 0) {
          result[lineIdx] = {
            commitId: commits[i - 1].id,
            message: commits[i - 1].message,
            line: targetLine,
          };
        }
        break;
      }

      // If we reached the oldest commit and line is still there, blame that commit
      if (i === commits.length - 1) {
        result[lineIdx] = {
          commitId: commit.id,
          message: commit.message,
          line: targetLine,
        };
      }
    }
  }

  return result;
}
```

- [ ] **Step 4: Register in `commands/index.ts`**

Add import:
```ts
import { execBlame } from "./blame";
```

Add to `gitCommands` record:
```ts
blame: execBlame,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest blame.test.ts --verbose 2>&1 | tail -20`
Expected: All 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/git-sandbox/commands/blame.ts src/engine/git-sandbox/__tests__/blame.test.ts src/engine/git-sandbox/commands/index.ts
git commit -m "feat(engine): implement git blame command"
```

---

### Task 4: Implement `git bisect`

**Files:**
- Create: `src/engine/git-sandbox/commands/bisect.ts`
- Create: `src/engine/git-sandbox/__tests__/bisect.test.ts`
- Modify: `src/engine/git-sandbox/commands/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/engine/git-sandbox/__tests__/bisect.test.ts`:

```ts
import { GitEngine } from "../GitEngine";

describe("git bisect", () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine();
    engine.execute("git init");
    // Create 5 commits
    engine.execute('echo "v1" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "commit 1"');
    engine.execute('echo "v2" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "commit 2"');
    engine.execute('echo "v3" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "commit 3"');
    engine.execute('echo "v4" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "commit 4"');
    engine.execute('echo "v5" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "commit 5"');
  });

  test("start begins a bisect session", () => {
    const result = engine.execute("git bisect start");
    expect(result.lines[0].type).toBe("success");
    expect(engine.state.bisect).not.toBeNull();
    expect(engine.state.bisect!.active).toBe(true);
  });

  test("bad marks current HEAD as bad", () => {
    engine.execute("git bisect start");
    const result = engine.execute("git bisect bad");
    expect(result.lines[0].type).toBe("success");
    const headCommitId = engine.state.commits[4].id;
    expect(engine.state.bisect!.badCommits).toContain(headCommitId);
  });

  test("good marks a commit as good and checks out midpoint", () => {
    engine.execute("git bisect start");
    engine.execute("git bisect bad");
    const firstCommitId = engine.state.commits[0].id;
    const result = engine.execute(`git bisect good ${firstCommitId}`);
    expect(result.lines[0].type).toBe("success");
    // Should have checked out a midpoint commit
    expect(engine.state.isDetached).toBe(true);
  });

  test("reset ends bisect and restores original HEAD", () => {
    engine.execute("git bisect start");
    engine.execute("git bisect bad");
    const firstCommitId = engine.state.commits[0].id;
    engine.execute(`git bisect good ${firstCommitId}`);

    const result = engine.execute("git bisect reset");
    expect(result.lines[0].type).toBe("success");
    expect(engine.state.bisect).toBeNull();
    expect(engine.state.isDetached).toBe(false);
    expect(engine.state.head).toBe("main");
  });

  test("errors when using bad/good without start", () => {
    const result = engine.execute("git bisect bad");
    expect(result.lines[0].type).toBe("error");
  });

  test("errors when using reset without active session", () => {
    const result = engine.execute("git bisect reset");
    expect(result.lines[0].type).toBe("error");
  });

  test("narrows range with successive good/bad marks", () => {
    engine.execute("git bisect start");
    engine.execute("git bisect bad");
    const firstCommitId = engine.state.commits[0].id;
    engine.execute(`git bisect good ${firstCommitId}`);

    // Mark the midpoint as good — should narrow the range further
    const result = engine.execute("git bisect good");
    expect(result.lines[0].type).toBe("success");
  });

  test("reports found commit when range narrows to one", () => {
    engine.execute("git bisect start");
    engine.execute("git bisect bad");
    const firstCommitId = engine.state.commits[0].id;
    engine.execute(`git bisect good ${firstCommitId}`);

    // Keep bisecting until we find the commit
    let found = false;
    for (let i = 0; i < 10; i++) {
      const result = engine.execute("git bisect good");
      const text = result.lines.map((l) => l.text).join("\n");
      if (text.includes("is the first bad commit")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest bisect.test.ts --verbose 2>&1 | tail -20`
Expected: FAIL.

- [ ] **Step 3: Implement `git bisect`**

Create `src/engine/git-sandbox/commands/bisect.ts`:

```ts
import { EngineState, CommandOutput, ParsedCommand } from "../types";
import { getCurrentCommitId, getCommitById, getReachableCommits } from "./basic";

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

  // Build linear commit list (reachable from latest bad)
  const allCommits = getReachableCommits(state);
  // We need commits reachable from the bad commit, not from current HEAD
  // Re-derive from the bad commit
  const badId = bisect.badCommits[bisect.badCommits.length - 1];
  const linearCommits = getLinearCommitsFrom(state, badId);

  // Find range between good and bad
  const goodSet = new Set(bisect.goodCommits);
  const candidates: string[] = [];

  for (const commit of linearCommits) {
    if (goodSet.has(commit.id)) break;
    candidates.push(commit.id);
  }

  if (candidates.length <= 1) {
    // Found it
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

  // Checkout midpoint
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

  // Restore working dir to the branch tip
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

function getLinearCommitsFrom(state: EngineState, startId: string) {
  const result: Array<{ id: string; message: string; snapshot: Map<string, string> }> = [];
  let currentId: string | null = startId;
  while (currentId) {
    const commit = state.commits.find((c) => c.id === currentId);
    if (!commit) break;
    result.push(commit);
    currentId = commit.parentId;
  }
  return result;
}
```

- [ ] **Step 4: Register in `commands/index.ts`**

Add import:
```ts
import { execBisect } from "./bisect";
```

Add to `gitCommands` record:
```ts
bisect: execBisect,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest bisect.test.ts --verbose 2>&1 | tail -30`
Expected: All 8 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/git-sandbox/commands/bisect.ts src/engine/git-sandbox/__tests__/bisect.test.ts src/engine/git-sandbox/commands/index.ts
git commit -m "feat(engine): implement git bisect command"
```

---

### Task 5: Update completions and graph data for new commands

**Files:**
- Modify: `src/engine/git-sandbox/GitEngine.ts`
- Modify: `src/engine/git-sandbox/commands/basic.ts` (`getBranchLabels` to include tags)

- [ ] **Step 1: Add new commands to `getCompletions` in `GitEngine.ts`**

In the `gitCmds` array inside `getCompletions()`, add:
```ts
"git tag", "git blame", "git bisect"
```

- [ ] **Step 2: Update `getGraphData` to return tags**

In `GitEngine.ts`, update `getGraphData()` to return tags alongside commits and branches:

```ts
getGraphData() {
  // ... existing commits and branches code ...

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
```

- [ ] **Step 3: Update `getBranchLabels` in `basic.ts` to include tag labels**

Modify the `getBranchLabels` function to also show tags:

```ts
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
```

- [ ] **Step 4: Run all tests**

Run: `npx jest --verbose 2>&1 | tail -30`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/git-sandbox/GitEngine.ts src/engine/git-sandbox/commands/basic.ts
git commit -m "feat(engine): add tag/blame/bisect to completions, tags to graph and log"
```

---

### Task 6: Implement GitEngine serialization

**Files:**
- Modify: `src/engine/git-sandbox/GitEngine.ts`
- Create: `src/engine/git-sandbox/__tests__/serialization.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/engine/git-sandbox/__tests__/serialization.test.ts`:

```ts
import { GitEngine } from "../GitEngine";

describe("GitEngine serialization", () => {
  test("serialize and deserialize empty engine", () => {
    const engine = new GitEngine();
    engine.execute("git init");

    const json = engine.serialize();
    const restored = GitEngine.deserialize(json);

    expect(restored.state.initialized).toBe(true);
    expect(restored.state.branches.get("main")).toBe("");
  });

  test("serialize and deserialize with commits", () => {
    const engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "hello" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "initial"');

    const json = engine.serialize();
    const restored = GitEngine.deserialize(json);

    expect(restored.state.commits.length).toBe(1);
    expect(restored.state.commits[0].message).toBe("initial");
    expect(restored.state.commits[0].snapshot.get("file.txt")).toBe("hello");
    expect(restored.state.workingDir.get("file.txt")).toBe("hello");
  });

  test("serialize and deserialize with branches", () => {
    const engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "a" > a.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "first"');
    engine.execute("git switch -c feature");
    engine.execute('echo "b" > b.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "feature"');

    const json = engine.serialize();
    const restored = GitEngine.deserialize(json);

    expect(restored.state.head).toBe("feature");
    expect(restored.state.branches.has("main")).toBe(true);
    expect(restored.state.branches.has("feature")).toBe(true);
    expect(restored.state.commits.length).toBe(2);
  });

  test("serialize and deserialize with tags", () => {
    const engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "a" > a.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "first"');
    engine.execute("git tag v1.0");

    const json = engine.serialize();
    const restored = GitEngine.deserialize(json);

    expect(restored.state.tags.has("v1.0")).toBe(true);
  });

  test("serialize and deserialize with remotes", () => {
    const engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "a" > a.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "first"');
    engine.execute("git remote add origin https://example.com/repo.git");

    const json = engine.serialize();
    const restored = GitEngine.deserialize(json);

    expect(restored.state.remotes.has("origin")).toBe(true);
  });

  test("preserves command history", () => {
    const engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "hello" > file.txt');

    const json = engine.serialize();
    const restored = GitEngine.deserialize(json);

    expect(restored.history).toEqual(["git init", 'echo "hello" > file.txt']);
  });

  test("deserialized engine can execute commands", () => {
    const engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "hello" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "initial"');

    const json = engine.serialize();
    const restored = GitEngine.deserialize(json);

    // Should be able to continue working
    restored.execute('echo "world" > file2.txt');
    restored.execute("git add .");
    const result = restored.execute('git commit -m "second"');
    expect(result.lines[0].type).toBe("success");
    expect(restored.state.commits.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest serialization.test.ts --verbose 2>&1 | tail -20`
Expected: FAIL — `serialize`/`deserialize` not found.

- [ ] **Step 3: Implement serialization in `GitEngine`**

Add the following methods to the `GitEngine` class in `src/engine/git-sandbox/GitEngine.ts`:

```ts
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
```

Add these helper functions after the `createEmptyState` function (outside the class):

```ts
function serializeState(state: EngineState): Record<string, unknown> {
  return {
    initialized: state.initialized,
    workingDir: [...state.workingDir.entries()],
    stagingArea: [...state.stagingArea.entries()],
    commits: state.commits.map((c) => ({
      ...c,
      snapshot: [...c.snapshot.entries()],
    })),
    branches: [...state.branches.entries()],
    head: state.head,
    isDetached: state.isDetached,
    remotes: [...state.remotes.entries()].map(([name, remote]) => [
      name,
      {
        branches: [...remote.branches.entries()],
        commits: remote.commits.map((c) => ({
          ...c,
          snapshot: [...c.snapshot.entries()],
        })),
      },
    ]),
    stash: state.stash.map((s) => ({
      message: s.message,
      workingDir: [...s.workingDir.entries()],
      stagingArea: [...s.stagingArea.entries()],
    })),
    reflog: state.reflog,
    conflictFiles: [...state.conflictFiles.entries()],
    tags: [...state.tags.entries()],
    bisect: state.bisect,
  };
}

function deserializeState(data: Record<string, unknown>): EngineState {
  const d = data as Record<string, any>;
  return {
    initialized: d.initialized,
    workingDir: new Map(d.workingDir),
    stagingArea: new Map(d.stagingArea),
    commits: d.commits.map((c: any) => ({
      ...c,
      snapshot: new Map(c.snapshot),
    })),
    branches: new Map(d.branches),
    head: d.head,
    isDetached: d.isDetached,
    remotes: new Map(
      (d.remotes as [string, any][]).map(([name, remote]) => [
        name,
        {
          branches: new Map(remote.branches),
          commits: remote.commits.map((c: any) => ({
            ...c,
            snapshot: new Map(c.snapshot),
          })),
        },
      ])
    ),
    stash: d.stash.map((s: any) => ({
      message: s.message,
      workingDir: new Map(s.workingDir),
      stagingArea: new Map(s.stagingArea),
    })),
    reflog: d.reflog,
    conflictFiles: new Map(d.conflictFiles),
    tags: new Map(d.tags),
    bisect: d.bisect,
  };
}
```

Add `EngineState` to the imports from `./types` at the top of `GitEngine.ts` if not already imported.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest serialization.test.ts --verbose 2>&1 | tail -30`
Expected: All 7 tests pass.

- [ ] **Step 5: Run all tests**

Run: `npx jest --verbose 2>&1 | tail -30`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/git-sandbox/GitEngine.ts src/engine/git-sandbox/__tests__/serialization.test.ts
git commit -m "feat(engine): add serialize/deserialize for GitEngine persistence"
```

---

### Task 7: Add localStorage persistence to SandboxLayout

**Files:**
- Modify: `src/components/sandbox/SandboxLayout.tsx`
- Modify: `src/app/sandbox/page.tsx`

- [ ] **Step 1: Update `SandboxLayout` to accept optional `levelId` prop**

In `src/components/sandbox/SandboxLayout.tsx`, update the component signature:

```ts
interface SandboxLayoutProps {
  levelId?: string;
}

export function SandboxLayout({ levelId }: SandboxLayoutProps) {
```

- [ ] **Step 2: Add persistence helpers**

Add at the top of the file (after imports):

```ts
const SANDBOX_KEY = "gitquest-sandbox";

function getSandboxKey(levelId?: string): string {
  return levelId ? `gitquest-sandbox-level-${levelId}` : SANDBOX_KEY;
}

interface SandboxSave {
  engineState: string;
  outputLines: OutputLine[];
  savedAt: number;
}

function saveSandbox(key: string, engine: GitEngine, outputLines: OutputLine[]) {
  try {
    const data: SandboxSave = {
      engineState: engine.serialize(),
      outputLines,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function loadSandbox(key: string): SandboxSave | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SandboxSave;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Initialize from localStorage on mount**

Replace the current `useRef(new GitEngine())` with a lazy initialization using `useState`:

```ts
const [engine] = useState(() => {
  const key = getSandboxKey(levelId);
  const saved = loadSandbox(key);
  if (saved) {
    try {
      return GitEngine.deserialize(saved.engineState);
    } catch {
      return new GitEngine();
    }
  }
  return new GitEngine();
});

const [outputLines, setOutputLines] = useState<OutputLine[]>(() => {
  const key = getSandboxKey(levelId);
  const saved = loadSandbox(key);
  return saved?.outputLines ?? [];
});
```

Remove the old `engineRef` and replace all `engineRef.current` references with `engine`.

- [ ] **Step 4: Auto-save after each command**

Update `handleExecute` to save after execution:

```ts
const handleExecute = useCallback(
  (cmd: string) => {
    const result = engine.execute(cmd);

    const newLines = [
      ...outputLines,
      { text: `$ ${cmd}`, type: "info" as const },
      ...result.lines,
    ];
    setOutputLines(newLines);
    refreshState();
    saveSandbox(getSandboxKey(levelId), engine, newLines);
  },
  [engine, outputLines, refreshState, levelId]
);
```

Note: since `outputLines` is now a dependency, we need to use the functional updater pattern instead. Revise to:

```ts
const handleExecute = useCallback(
  (cmd: string) => {
    const result = engine.execute(cmd);

    setOutputLines((prev) => {
      const newLines = [
        ...prev,
        { text: `$ ${cmd}`, type: "info" as const },
        ...result.lines,
      ];
      saveSandbox(getSandboxKey(levelId), engine, newLines);
      return newLines;
    });

    refreshState();
  },
  [engine, refreshState, levelId]
);
```

- [ ] **Step 5: Clear localStorage on reset**

Update `handleReset`:

```ts
const handleReset = useCallback(() => {
  engine.reset();
  setOutputLines([]);
  setInsertCommand("");
  refreshState();
  localStorage.removeItem(getSandboxKey(levelId));
}, [engine, refreshState, levelId]);
```

- [ ] **Step 6: Update sandbox page to pass levelId**

Update `src/app/sandbox/page.tsx`:

```ts
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SandboxLayout } from "@/components/sandbox";

function SandboxContent() {
  const searchParams = useSearchParams();
  const levelId = searchParams.get("level") ?? undefined;

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <SandboxLayout levelId={levelId} />
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-3.5rem)]" />}>
      <SandboxContent />
    </Suspense>
  );
}
```

(`Suspense` is required because `useSearchParams` needs it in Next.js 16.)

- [ ] **Step 7: Run the dev server and manually verify persistence**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/sandbox/SandboxLayout.tsx src/app/sandbox/page.tsx
git commit -m "feat(sandbox): add localStorage persistence and level query param"
```

---

### Task 8: Add ValidationResult type and SandboxChallenge component

**Files:**
- Create: `src/components/sandbox/SandboxChallenge.tsx`
- Modify: `src/components/sandbox/index.ts`

- [ ] **Step 1: Create `SandboxChallenge` component**

Create `src/components/sandbox/SandboxChallenge.tsx`:

```tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { GitEngine } from "@/engine/git-sandbox/GitEngine";
import { EngineState, OutputLine } from "@/engine/git-sandbox/types";
import { SandboxTerminal } from "./SandboxTerminal";

export interface ValidationCheck {
  label: string;
  passed: boolean;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}

interface SandboxChallengeProps {
  description: string;
  hint?: string;
  preset?: () => EngineState;
  validate: (state: EngineState) => ValidationResult;
  onComplete: () => void;
}

export function SandboxChallenge({
  description,
  hint,
  preset,
  validate,
  onComplete,
}: SandboxChallengeProps) {
  const [engine] = useState(() => {
    const e = new GitEngine();
    if (preset) {
      e.state = preset();
    }
    return e;
  });

  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [validation, setValidation] = useState<ValidationResult>(() =>
    validate(engine.state)
  );
  const [showHint, setShowHint] = useState(false);

  const handleExecute = useCallback(
    (cmd: string) => {
      const result = engine.execute(cmd);
      setOutputLines((prev) => [
        ...prev,
        { text: `$ ${cmd}`, type: "info" as const },
        ...result.lines,
      ]);
      setValidation(validate(engine.state));
    },
    [engine, validate]
  );

  const getCompletions = useCallback(
    (partial: string) => engine.getCompletions(partial),
    [engine]
  );

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-2">
          🏋️ Практика
        </h3>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>

      {/* Terminal */}
      <div className="h-64 rounded-lg overflow-hidden">
        <SandboxTerminal
          outputLines={outputLines}
          onExecute={handleExecute}
          getCompletions={getCompletions}
        />
      </div>

      {/* Validation checklist */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-400">Проверки:</p>
        {validation.checks.map((check, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={check.passed ? "text-emerald-400" : "text-gray-600"}>
              {check.passed ? "✓" : "○"}
            </span>
            <span className={check.passed ? "text-gray-300" : "text-gray-500"}>
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 items-center">
        {hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            {showHint ? "Скрыть подсказку" : "💡 Подсказка"}
          </button>
        )}

        {validation.passed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onComplete}
            className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            Завершить
          </motion.button>
        )}
      </div>

      {showHint && hint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-3 bg-amber-500/5 rounded-lg text-sm text-amber-300/80 border border-amber-500/10"
        >
          💡 {hint}
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Export from `index.ts`**

Update `src/components/sandbox/index.ts` to add:

```ts
export { SandboxChallenge } from "./SandboxChallenge";
export type { ValidationResult, ValidationCheck } from "./SandboxChallenge";
```

- [ ] **Step 3: Build to verify no type errors**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/sandbox/SandboxChallenge.tsx src/components/sandbox/index.ts
git commit -m "feat(sandbox): add SandboxChallenge component with inline terminal and validation"
```

---

### Task 9: Extend level registry with `loadPreset` and `loadValidator`

**Files:**
- Modify: `src/levels/registry.ts`

- [ ] **Step 1: Update `LevelEntry` type**

In `src/levels/registry.ts`, update the `LevelEntry` interface:

```ts
import { EngineState } from "@/engine/git-sandbox/types";
import { ValidationResult } from "@/components/sandbox/SandboxChallenge";

interface LevelEntry {
  meta: LevelMeta;
  load: () => Promise<{ default: ComponentType<{ onComplete: (correct: number, total: number) => void }> }>;
  loadPreset?: () => Promise<{ createPreset: () => EngineState }>;
  loadValidator?: () => Promise<{ validate: (state: EngineState) => ValidationResult }>;
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds (no levels use the new fields yet).

- [ ] **Step 3: Commit**

```bash
git add src/levels/registry.ts
git commit -m "feat(registry): add loadPreset and loadValidator to LevelEntry"
```

---

### Task 10: Create preset and validator for level 03-staging (example level)

**Files:**
- Create: `src/levels/03-staging/preset.ts`
- Create: `src/levels/03-staging/validator.ts`
- Modify: `src/levels/registry.ts` (add loadPreset/loadValidator for level 03)

- [ ] **Step 1: Read current level 03 to understand what it teaches**

Read `src/levels/03-staging/Level.tsx` and `src/levels/03-staging/meta.json` to understand the challenge.

- [ ] **Step 2: Create preset for level 03**

Create `src/levels/03-staging/preset.ts`:

```ts
import { EngineState } from "@/engine/git-sandbox/types";

export function createPreset(): EngineState {
  // Pre-initialized repo with one commit and an untracked file
  const commitId = "abc1234";
  const snapshot = new Map<string, string>([
    ["README.md", "# My Project"],
  ]);

  return {
    initialized: true,
    workingDir: new Map<string, string>([
      ["README.md", "# My Project"],
      ["app.js", 'console.log("hello");'],
    ]),
    stagingArea: new Map<string, string>([
      ["README.md", "# My Project"],
    ]),
    commits: [
      {
        id: commitId,
        message: "initial commit",
        timestamp: Date.now(),
        parentId: null,
        secondParentId: null,
        snapshot,
        branch: "main",
      },
    ],
    branches: new Map([["main", commitId]]),
    head: "main",
    isDetached: false,
    remotes: new Map(),
    stash: [],
    reflog: [{ commitId, action: "commit", message: "commit: initial commit" }],
    conflictFiles: new Map(),
    tags: new Map(),
    bisect: null,
  };
}
```

- [ ] **Step 3: Create validator for level 03**

Create `src/levels/03-staging/validator.ts`:

```ts
import { EngineState } from "@/engine/git-sandbox/types";
import { ValidationResult } from "@/components/sandbox/SandboxChallenge";

export function validate(state: EngineState): ValidationResult {
  const checks = [
    {
      label: "Файл app.js добавлен в staging area",
      passed: state.stagingArea.has("app.js"),
    },
    {
      label: "Создан коммит с файлом app.js",
      passed: state.commits.some(
        (c) => c.snapshot.has("app.js") && c.message !== "initial commit"
      ),
    },
  ];

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}
```

- [ ] **Step 4: Register preset and validator in `registry.ts`**

Add to the level 03 entry in the `LEVELS` array:

```ts
{
  meta: meta03 as LevelMeta,
  load: () => import("./03-staging/Level"),
  loadPreset: () => import("./03-staging/preset"),
  loadValidator: () => import("./03-staging/validator"),
},
```

- [ ] **Step 5: Build to verify**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/levels/03-staging/preset.ts src/levels/03-staging/validator.ts src/levels/registry.ts
git commit -m "feat(levels): add preset and validator for level 03-staging"
```

---

### Task 11: Wire SandboxChallenge into level page

**Files:**
- Modify: `src/app/level/[id]/page.tsx`

- [ ] **Step 1: Update `LevelPage` to load preset and validator**

In `src/app/level/[id]/page.tsx`, add imports:

```ts
import { SandboxChallenge, ValidationResult } from "@/components/sandbox";
import { EngineState } from "@/engine/git-sandbox/types";
```

Add state for preset and validator:

```ts
const [preset, setPreset] = useState<(() => EngineState) | null>(null);
const [validator, setValidator] = useState<((state: EngineState) => ValidationResult) | null>(null);
```

In the `useEffect` where the level is loaded, add after `entry.load()`:

```ts
if (entry.loadPreset) {
  entry.loadPreset().then((mod) => setPreset(() => mod.createPreset));
}
if (entry.loadValidator) {
  entry.loadValidator().then((mod) => setValidator(() => mod.validate));
}
```

- [ ] **Step 2: Pass preset/validator into the Level component**

Update the `LevelComponent` type to optionally accept preset and validator:

```ts
type ComponentType = React.ComponentType<{
  onComplete: (quizCorrect: number, quizTotal: number) => void;
  preset?: () => EngineState;
  validator?: (state: EngineState) => ValidationResult;
}>;
```

Pass them in the render:

```tsx
<LevelComponent
  onComplete={handleComplete}
  preset={preset ?? undefined}
  validator={validator ?? undefined}
/>
```

- [ ] **Step 3: Update Level 03 to use SandboxChallenge when validator is available**

In `src/levels/03-staging/Level.tsx`, add to the props interface:

```ts
import { SandboxChallenge, ValidationResult } from "@/components/sandbox";
import { EngineState } from "@/engine/git-sandbox/types";

interface LevelProps {
  onComplete: (quizCorrect: number, quizTotal: number) => void;
  preset?: () => EngineState;
  validator?: (state: EngineState) => ValidationResult;
}
```

Replace the challenge step's `<Challenge>` with a conditional:

```tsx
{currentStep === "challenge" && (
  <motion.div
    key="challenge"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-4"
  >
    <NarrativeBox text="Теория — это здорово, но настоящие навыки появляются только с практикой. Попробуй выполнить задание!" />

    {validator ? (
      <SandboxChallenge
        description={challengeTask.description}
        hint={challengeTask.hint}
        preset={preset}
        validate={validator}
        onComplete={handleChallengeComplete}
      />
    ) : (
      <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
    )}
  </motion.div>
)}
```

- [ ] **Step 4: Build and verify**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/level/[id]/page.tsx src/levels/03-staging/Level.tsx
git commit -m "feat(levels): wire SandboxChallenge into level page with preset/validator"
```

---

### Task 12: Add "Open in sandbox" button to all levels

**Files:**
- Modify: Multiple `Level.tsx` files (levels 03–33)

- [ ] **Step 1: Add sandbox link to levels that don't have it**

Levels 01 and 02 already have the link. For all other levels (03–33), add the sandbox link to the visualization step's button row. The pattern is:

```tsx
import Link from "next/link";
```

And in the visualization step's button group, add:

```tsx
<Link
  href={`/sandbox?level=${LEVEL_ID}`}
  target="_blank"
  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
>
  🧪 Открыть в песочнице
</Link>
```

Where `LEVEL_ID` matches the level's `meta.json` `id` field (e.g., `"03-staging"`, `"04-status"`, etc.).

Each level already imports `Link` from `next/link` and has a visualization step with buttons. Add the sandbox link alongside existing buttons in that step.

- [ ] **Step 2: Build and verify**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/levels/*/Level.tsx
git commit -m "feat(levels): add 'Open in sandbox' button to all level visualization steps"
```

---

### Task 13: Show tags in GitVisualizer

**Files:**
- Modify: `src/types/git-graph.ts`
- Modify: `src/components/git-visualizer/CommitNode.tsx`
- Modify: `src/components/git-visualizer/useGitGraph.ts`

- [ ] **Step 1: Read CommitNode and useGitGraph to understand current structure**

Read `src/components/git-visualizer/CommitNode.tsx` and `src/components/git-visualizer/useGitGraph.ts` to understand how branches are rendered on commits.

- [ ] **Step 2: Add `tags` to `GitGraphState`**

In `src/types/git-graph.ts`, add to `GitGraphState`:

```ts
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
```

- [ ] **Step 3: Pass tags through to CommitNode**

In `useGitGraph.ts`, extend the node data to include tag labels alongside branch labels. In `CommitNode.tsx`, render tag labels with a distinct style (e.g., amber/yellow background instead of the branch color).

The exact implementation depends on the current node rendering structure discovered in Step 1.

- [ ] **Step 4: Build and verify**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/types/git-graph.ts src/components/git-visualizer/CommitNode.tsx src/components/git-visualizer/useGitGraph.ts
git commit -m "feat(visualizer): display tags on commit nodes"
```

---

### Task 14: Final integration test

- [ ] **Step 1: Run all unit tests**

Run: `npx jest --verbose 2>&1 | tail -40`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Run lint**

Run: `npx eslint src/ 2>&1 | tail -20`
Expected: No errors (warnings acceptable).

- [ ] **Step 4: Commit any remaining fixes if needed**
