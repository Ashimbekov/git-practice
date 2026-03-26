# Git Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive git sandbox where users type commands in a virtual terminal and see the git graph and filesystem update in real-time.

**Architecture:** Custom in-memory GitEngine class that processes parsed commands and mutates state (working dir, staging, commits, branches). Three-panel UI (terminal, graph, files) reuses existing GitVisualizer. No external git dependencies.

**Tech Stack:** TypeScript, React, Next.js, framer-motion, existing GitVisualizer SVG component

---

### Task 1: Engine Types

**Files:**
- Create: `src/engine/git-sandbox/types.ts`

- [ ] **Step 1: Create sandbox types**

Create `src/engine/git-sandbox/types.ts`:

```ts
export interface FileEntry {
  path: string;
  content: string;
}

export type FileStatus = "untracked" | "modified" | "staged" | "deleted" | "conflict";

export interface FileStatusEntry {
  path: string;
  status: FileStatus;
  content: string;
}

export interface CommitObject {
  id: string;
  message: string;
  timestamp: number;
  parentId: string | null;
  secondParentId: string | null;
  snapshot: Map<string, string>; // path → content at commit time
  branch: string; // branch name when committed
}

export interface RemoteState {
  branches: Map<string, string>; // branch name → commitId
  commits: CommitObject[];
}

export interface StashedState {
  message: string;
  workingDir: Map<string, string>;
  stagingArea: Map<string, string>;
}

export interface ReflogEntry {
  commitId: string;
  action: string;
  message: string;
}

export interface EngineState {
  initialized: boolean;
  workingDir: Map<string, string>;
  stagingArea: Map<string, string>;
  commits: CommitObject[];
  branches: Map<string, string>; // name → commitId
  head: string; // branch name or commitId (detached)
  isDetached: boolean;
  remotes: Map<string, RemoteState>;
  stash: StashedState[];
  reflog: ReflogEntry[];
  conflictFiles: Map<string, { ours: string; theirs: string }>;
}

export interface CommandOutput {
  lines: OutputLine[];
}

export interface OutputLine {
  text: string;
  type: "info" | "success" | "error" | "warning" | "hint";
}

export interface ParsedCommand {
  raw: string;
  program: string; // "git", "echo", "cat", "ls", "rm"
  subcommand: string; // "add", "commit", "branch", etc.
  args: string[]; // positional arguments
  flags: Record<string, string | boolean>; // --flag value or -f
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/engine/git-sandbox/
git commit -m "feat(sandbox): add engine types for git sandbox"
```

---

### Task 2: Command Parser

**Files:**
- Create: `src/engine/git-sandbox/parser.ts`
- Create: `src/engine/git-sandbox/__tests__/parser.test.ts`

- [ ] **Step 1: Write parser tests**

Create `src/engine/git-sandbox/__tests__/parser.test.ts`:

```ts
import { parseCommand } from "../parser";

describe("parseCommand", () => {
  test("parses git add file.txt", () => {
    const cmd = parseCommand("git add file.txt");
    expect(cmd.program).toBe("git");
    expect(cmd.subcommand).toBe("add");
    expect(cmd.args).toEqual(["file.txt"]);
  });

  test("parses git commit -m with quoted message", () => {
    const cmd = parseCommand('git commit -m "Initial commit"');
    expect(cmd.program).toBe("git");
    expect(cmd.subcommand).toBe("commit");
    expect(cmd.flags["m"]).toBe("Initial commit");
  });

  test("parses git branch -d feature", () => {
    const cmd = parseCommand("git branch -d feature");
    expect(cmd.subcommand).toBe("branch");
    expect(cmd.flags["d"]).toBe(true);
    expect(cmd.args).toEqual(["feature"]);
  });

  test("parses git log --oneline", () => {
    const cmd = parseCommand("git log --oneline");
    expect(cmd.subcommand).toBe("log");
    expect(cmd.flags["oneline"]).toBe(true);
  });

  test("parses git reset --hard HEAD~1", () => {
    const cmd = parseCommand("git reset --hard HEAD~1");
    expect(cmd.subcommand).toBe("reset");
    expect(cmd.flags["hard"]).toBe(true);
    expect(cmd.args).toEqual(["HEAD~1"]);
  });

  test("parses echo with redirect", () => {
    const cmd = parseCommand('echo "hello world" > file.txt');
    expect(cmd.program).toBe("echo");
    expect(cmd.args).toContain("hello world");
    expect(cmd.flags[">"]).toBe("file.txt");
  });

  test("parses git switch -c new-branch", () => {
    const cmd = parseCommand("git switch -c new-branch");
    expect(cmd.subcommand).toBe("switch");
    expect(cmd.flags["c"]).toBe(true);
    expect(cmd.args).toEqual(["new-branch"]);
  });

  test("parses simple ls", () => {
    const cmd = parseCommand("ls");
    expect(cmd.program).toBe("ls");
  });

  test("parses cat file.txt", () => {
    const cmd = parseCommand("cat file.txt");
    expect(cmd.program).toBe("cat");
    expect(cmd.args).toEqual(["file.txt"]);
  });

  test("parses rm file.txt", () => {
    const cmd = parseCommand("rm file.txt");
    expect(cmd.program).toBe("rm");
    expect(cmd.args).toEqual(["file.txt"]);
  });

  test("parses git diff --staged", () => {
    const cmd = parseCommand("git diff --staged");
    expect(cmd.subcommand).toBe("diff");
    expect(cmd.flags["staged"]).toBe(true);
  });

  test("parses git checkout as switch alias", () => {
    const cmd = parseCommand("git checkout -b feature");
    expect(cmd.subcommand).toBe("checkout");
    expect(cmd.flags["b"]).toBe(true);
    expect(cmd.args).toEqual(["feature"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/engine/git-sandbox/__tests__/parser.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement parser**

Create `src/engine/git-sandbox/parser.ts`:

```ts
import { ParsedCommand } from "./types";

export function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();

  // Handle echo with redirect: echo "content" > file
  if (raw.startsWith("echo ")) {
    return parseEcho(raw);
  }

  const tokens = tokenize(raw);
  if (tokens.length === 0) {
    return { raw, program: "", subcommand: "", args: [], flags: {} };
  }

  const program = tokens[0];

  if (program === "git") {
    return parseGitCommand(raw, tokens.slice(1));
  }

  // Shell commands: cat, ls, rm
  return {
    raw,
    program,
    subcommand: "",
    args: tokens.slice(1),
    flags: {},
  };
}

function parseEcho(raw: string): ParsedCommand {
  const redirectIndex = raw.indexOf(">");
  const flags: Record<string, string | boolean> = {};
  let args: string[] = [];

  if (redirectIndex !== -1) {
    const content = raw.slice(5, redirectIndex).trim();
    const target = raw.slice(redirectIndex + 1).trim();
    args = [stripQuotes(content)];
    flags[">"] = target;
  } else {
    const content = raw.slice(5).trim();
    args = [stripQuotes(content)];
  }

  return { raw, program: "echo", subcommand: "", args, flags };
}

function parseGitCommand(raw: string, tokens: string[]): ParsedCommand {
  if (tokens.length === 0) {
    return { raw, program: "git", subcommand: "", args: [], flags: {} };
  }

  const subcommand = tokens[0];
  const rest = tokens.slice(1);
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  // Flags that consume the next token as their value
  const flagsWithValue = new Set(["m", "b", "c"]);

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];

    if (token.startsWith("--")) {
      const flagName = token.slice(2);
      flags[flagName] = true;
    } else if (token.startsWith("-") && token.length > 1) {
      const flagName = token.slice(1);
      if (flagsWithValue.has(flagName) && i + 1 < rest.length) {
        const nextToken = rest[i + 1];
        // Check if the next token looks like a flag-value or a standalone arg
        if (!nextToken.startsWith("-")) {
          flags[flagName] = stripQuotes(nextToken);
          i++;
        } else {
          flags[flagName] = true;
        }
      } else {
        flags[flagName] = true;
      }
    } else {
      args.push(stripQuotes(token));
    }
  }

  return { raw, program: "git", subcommand, args, flags };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuote) {
      if (ch === inQuote) {
        tokens.push(current);
        current = "";
        inQuote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      if (current) {
        tokens.push(current);
        current = "";
      }
      inQuote = ch;
    } else if (ch === " " || ch === "\t") {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }

  if (current) tokens.push(current);
  return tokens;
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}
```

- [ ] **Step 4: Run tests**

Run: `npx jest src/engine/git-sandbox/__tests__/parser.test.ts`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/git-sandbox/
git commit -m "feat(sandbox): add command parser with tests"
```

---

### Task 3: GitEngine Core + Basic Commands

**Files:**
- Create: `src/engine/git-sandbox/GitEngine.ts`
- Create: `src/engine/git-sandbox/commands/basic.ts`
- Create: `src/engine/git-sandbox/commands/filesystem.ts`
- Create: `src/engine/git-sandbox/commands/index.ts`
- Create: `src/engine/git-sandbox/__tests__/engine.test.ts`

This is the largest task. It implements the core engine + init, add, commit, status, log, diff, and shell commands (echo, cat, ls, rm).

- [ ] **Step 1: Write engine tests**

Create `src/engine/git-sandbox/__tests__/engine.test.ts`:

```ts
import { GitEngine } from "../GitEngine";

describe("GitEngine", () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine();
  });

  describe("initialization", () => {
    test("starts uninitialized", () => {
      const result = engine.execute("git status");
      expect(result.lines[0].type).toBe("error");
    });

    test("git init creates empty repo", () => {
      const result = engine.execute("git init");
      expect(result.lines[0].type).toBe("success");
    });
  });

  describe("file operations", () => {
    beforeEach(() => {
      engine.execute("git init");
    });

    test("echo creates file", () => {
      engine.execute('echo "hello" > file.txt');
      const result = engine.execute("cat file.txt");
      expect(result.lines[0].text).toBe("hello");
    });

    test("ls shows files", () => {
      engine.execute('echo "a" > a.txt');
      engine.execute('echo "b" > b.txt');
      const result = engine.execute("ls");
      expect(result.lines.map((l) => l.text)).toContain("a.txt");
      expect(result.lines.map((l) => l.text)).toContain("b.txt");
    });

    test("rm deletes file", () => {
      engine.execute('echo "a" > a.txt');
      engine.execute("rm a.txt");
      const result = engine.execute("ls");
      expect(result.lines.length).toBe(0);
    });
  });

  describe("add and commit", () => {
    beforeEach(() => {
      engine.execute("git init");
    });

    test("git add stages file", () => {
      engine.execute('echo "hello" > file.txt');
      engine.execute("git add file.txt");
      const result = engine.execute("git status");
      const texts = result.lines.map((l) => l.text).join("\n");
      expect(texts).toContain("file.txt");
    });

    test("git add . stages all files", () => {
      engine.execute('echo "a" > a.txt');
      engine.execute('echo "b" > b.txt');
      engine.execute("git add .");
      const result = engine.execute("git status");
      const texts = result.lines.map((l) => l.text).join("\n");
      expect(texts).toContain("a.txt");
      expect(texts).toContain("b.txt");
    });

    test("git commit creates commit", () => {
      engine.execute('echo "hello" > file.txt');
      engine.execute("git add file.txt");
      const result = engine.execute('git commit -m "Initial commit"');
      expect(result.lines[0].type).toBe("success");
    });

    test("git commit without staged files shows error", () => {
      const result = engine.execute('git commit -m "empty"');
      expect(result.lines[0].type).toBe("error");
    });

    test("git log shows commits", () => {
      engine.execute('echo "a" > a.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "first"');
      engine.execute('echo "b" > b.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "second"');
      const result = engine.execute("git log --oneline");
      expect(result.lines.length).toBe(2);
    });
  });

  describe("diff", () => {
    beforeEach(() => {
      engine.execute("git init");
      engine.execute('echo "line1" > file.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "initial"');
    });

    test("git diff shows working vs staging changes", () => {
      engine.execute('echo "line1\\nline2" > file.txt');
      const result = engine.execute("git diff");
      const texts = result.lines.map((l) => l.text).join("\n");
      expect(texts).toContain("+");
    });

    test("git diff --staged shows staging vs commit changes", () => {
      engine.execute('echo "changed" > file.txt');
      engine.execute("git add .");
      const result = engine.execute("git diff --staged");
      const texts = result.lines.map((l) => l.text).join("\n");
      expect(texts).toContain("+");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/engine/git-sandbox/__tests__/engine.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement engine types helper (generateId)**

Add to bottom of `src/engine/git-sandbox/types.ts`:

```ts
export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}
```

- [ ] **Step 4: Implement filesystem commands**

Create `src/engine/git-sandbox/commands/filesystem.ts`:

```ts
import { EngineState, CommandOutput, ParsedCommand } from "../types";

export function execEcho(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const content = cmd.args[0] ?? "";
  const target = cmd.flags[">"];

  if (typeof target === "string") {
    state.workingDir.set(target, content);
    return { lines: [] };
  }

  return { lines: [{ text: content, type: "info" }] };
}

export function execCat(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const path = cmd.args[0];
  if (!path) {
    return { lines: [{ text: "cat: missing file operand", type: "error" }] };
  }

  const content = state.workingDir.get(path);
  if (content === undefined) {
    return { lines: [{ text: `cat: ${path}: No such file`, type: "error" }] };
  }

  return { lines: content.split("\n").map((line) => ({ text: line, type: "info" as const })) };
}

export function execLs(state: EngineState): CommandOutput {
  const files = [...state.workingDir.keys()].sort();
  return { lines: files.map((f) => ({ text: f, type: "info" as const })) };
}

export function execRm(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const path = cmd.args[0];
  if (!path) {
    return { lines: [{ text: "rm: missing operand", type: "error" }] };
  }

  if (!state.workingDir.has(path)) {
    return { lines: [{ text: `rm: ${path}: No such file`, type: "error" }] };
  }

  state.workingDir.delete(path);
  return { lines: [] };
}
```

- [ ] **Step 5: Implement basic git commands**

Create `src/engine/git-sandbox/commands/basic.ts`:

```ts
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
      lines: [{ text: "Aborting commit: используй -m \"сообщение\"", type: "error" }],
    };
  }

  const lastSnapshot = getLastSnapshot(state);
  const hasChanges = !mapsEqual(state.stagingArea, lastSnapshot);

  if (!hasChanges && state.commits.length > 0) {
    return {
      lines: [
        { text: "nothing to commit, working tree clean", type: "warning" },
        { text: "💡 Сначала добавь файлы: git add <файл>", type: "hint" },
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
  return labels.join(", ");
}

function mapsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, val] of a) {
    if (b.get(key) !== val) return false;
  }
  return true;
}
```

- [ ] **Step 6: Implement command registry**

Create `src/engine/git-sandbox/commands/index.ts`:

```ts
import { EngineState, CommandOutput, ParsedCommand } from "../types";
import { execInit, execAdd, execCommit, execStatus, execLog, execDiff } from "./basic";
import { execEcho, execCat, execLs, execRm } from "./filesystem";

type CommandHandler = (state: EngineState, cmd: ParsedCommand) => CommandOutput;

const gitCommands: Record<string, CommandHandler> = {
  init: execInit,
  add: execAdd,
  commit: execCommit,
  status: execStatus,
  log: execLog,
  diff: execDiff,
};

const shellCommands: Record<string, CommandHandler> = {
  echo: execEcho,
  cat: execCat,
  ls: execLs,
  rm: execRm,
};

export function executeCommand(state: EngineState, cmd: ParsedCommand): CommandOutput {
  if (!state.initialized && cmd.program === "git" && cmd.subcommand !== "init") {
    return {
      lines: [
        { text: "fatal: not a git repository", type: "error" },
        { text: "💡 Сначала выполни: git init", type: "hint" },
      ],
    };
  }

  if (cmd.program === "git") {
    const handler = gitCommands[cmd.subcommand];
    if (!handler) {
      return {
        lines: [
          { text: `git: '${cmd.subcommand}' is not a git command`, type: "error" },
          { text: "💡 Доступные команды: init, add, commit, status, log, diff, branch, switch, merge, rebase, cherry-pick, reset, revert, stash, reflog, remote, push, pull, fetch", type: "hint" },
        ],
      };
    }
    return handler(state, cmd);
  }

  const handler = shellCommands[cmd.program];
  if (!handler) {
    return {
      lines: [{ text: `command not found: ${cmd.program}`, type: "error" }],
    };
  }
  return handler(state, cmd);
}

// Export for extending with more commands
export function registerGitCommand(name: string, handler: CommandHandler) {
  gitCommands[name] = handler;
}
```

- [ ] **Step 7: Implement GitEngine class**

Create `src/engine/git-sandbox/GitEngine.ts`:

```ts
import { EngineState, CommandOutput, ParsedCommand, CommitObject } from "./types";
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

    return {
      commits,
      branches,
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
      "git reset", "git revert", "git stash", "git reflog", "git remote", "git push", "git pull", "git fetch"];
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
  };
}
```

- [ ] **Step 8: Run tests**

Run: `npx jest src/engine/git-sandbox/__tests__/engine.test.ts`
Expected: All pass.

- [ ] **Step 9: Commit**

```bash
git add src/engine/git-sandbox/
git commit -m "feat(sandbox): add GitEngine core with basic commands, filesystem, and tests"
```

---

### Task 4: Branch & Merge Commands

**Files:**
- Create: `src/engine/git-sandbox/commands/branch.ts`
- Create: `src/engine/git-sandbox/__tests__/branch.test.ts`
- Modify: `src/engine/git-sandbox/commands/index.ts`

Implements: git branch, git switch, git checkout, git merge.

- [ ] **Step 1: Write branch tests**

Create `src/engine/git-sandbox/__tests__/branch.test.ts`:

```ts
import { GitEngine } from "../GitEngine";

describe("branch commands", () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "hello" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "initial"');
  });

  test("git branch creates branch", () => {
    engine.execute("git branch feature");
    const result = engine.execute("git branch");
    const texts = result.lines.map((l) => l.text).join("\n");
    expect(texts).toContain("feature");
    expect(texts).toContain("main");
  });

  test("git switch changes branch", () => {
    engine.execute("git branch feature");
    engine.execute("git switch feature");
    const result = engine.execute("git status");
    expect(result.lines[0].text).toContain("feature");
  });

  test("git switch -c creates and switches", () => {
    engine.execute("git switch -c feature");
    const result = engine.execute("git status");
    expect(result.lines[0].text).toContain("feature");
  });

  test("git branch -d deletes branch", () => {
    engine.execute("git branch feature");
    engine.execute("git branch -d feature");
    const result = engine.execute("git branch");
    const texts = result.lines.map((l) => l.text).join("\n");
    expect(texts).not.toContain("feature");
  });

  test("fast-forward merge", () => {
    engine.execute("git switch -c feature");
    engine.execute('echo "new" > new.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "feature commit"');
    engine.execute("git switch main");
    const result = engine.execute("git merge feature");
    expect(result.lines[0].text).toContain("Fast-forward");
  });

  test("3-way merge creates merge commit", () => {
    engine.execute("git switch -c feature");
    engine.execute('echo "feature" > feature.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "feature work"');
    engine.execute("git switch main");
    engine.execute('echo "main" > main.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "main work"');
    const result = engine.execute("git merge feature");
    expect(result.lines[0].type).toBe("success");
  });

  test("merge conflict detected", () => {
    engine.execute("git switch -c feature");
    engine.execute('echo "feature version" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "feature change"');
    engine.execute("git switch main");
    engine.execute('echo "main version" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "main change"');
    const result = engine.execute("git merge feature");
    const texts = result.lines.map((l) => l.text).join("\n");
    expect(texts).toContain("CONFLICT");
  });
});
```

- [ ] **Step 2: Implement branch commands**

Create `src/engine/git-sandbox/commands/branch.ts` with full implementations of `execBranch`, `execSwitch`, `execCheckout`, `execMerge`. The merge function should handle fast-forward, 3-way merge, and conflict detection. Export all functions.

Key behaviors:
- `git branch` (no args) → list branches, mark current with `*`
- `git branch <name>` → create branch at current HEAD commit
- `git branch -d <name>` → delete branch (error if current or unmerged)
- `git switch <name>` → change HEAD, update workingDir from branch's commit snapshot
- `git switch -c <name>` → create + switch
- `git checkout <name>` → alias for switch; `git checkout -b` → alias for switch -c
- `git merge <branch>` → ff if possible, 3-way otherwise, detect conflicts in same files

- [ ] **Step 3: Register commands in index.ts**

Add imports and register `branch`, `switch`, `checkout`, `merge` in `gitCommands` map.

- [ ] **Step 4: Run tests**

Run: `npx jest src/engine/git-sandbox/__tests__/branch.test.ts`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/git-sandbox/
git commit -m "feat(sandbox): add branch, switch, checkout, merge commands with conflict detection"
```

---

### Task 5: Advanced Commands

**Files:**
- Create: `src/engine/git-sandbox/commands/advanced.ts`
- Modify: `src/engine/git-sandbox/commands/index.ts`

Implements: rebase, cherry-pick, reset, revert, stash, reflog. Test via engine.test.ts or a new advanced.test.ts.

Key behaviors for each command:
- `git reset --soft <ref>` → move HEAD, keep staging+working
- `git reset --mixed <ref>` (default) → move HEAD, reset staging, keep working
- `git reset --hard <ref>` → move HEAD, reset staging+working
- `git revert <id>` → create new commit inverting changes of target
- `git stash` → save working+staging to stack, restore to last commit
- `git stash pop` → restore top stash entry
- `git stash list` → show stash stack
- `git reflog` → show reflog entries
- `git cherry-pick <id>` → copy commit's changes as new commit on current branch
- `git rebase <branch>` → replay current branch commits onto target branch tip

- [ ] **Step 1: Implement advanced commands**
- [ ] **Step 2: Register in index.ts**
- [ ] **Step 3: Write tests, run, verify pass**
- [ ] **Step 4: Commit**

```bash
git add src/engine/git-sandbox/
git commit -m "feat(sandbox): add rebase, cherry-pick, reset, revert, stash, reflog commands"
```

---

### Task 6: Remote Commands

**Files:**
- Create: `src/engine/git-sandbox/commands/remote.ts`
- Modify: `src/engine/git-sandbox/commands/index.ts`

Implements emulated: remote add/remove, push, pull, fetch. These simulate remote operations by maintaining a separate RemoteState inside EngineState.remotes.

Key behaviors:
- `git remote add <name> <url>` → create empty remote
- `git remote -v` → list remotes
- `git push origin main` → copy commits+branch to remote state
- `git fetch origin` → copy remote commits to local (as origin/main tracking)
- `git pull origin main` → fetch + merge

- [ ] **Step 1: Implement remote commands**
- [ ] **Step 2: Register in index.ts**
- [ ] **Step 3: Write tests, run, verify pass**
- [ ] **Step 4: Commit**

```bash
git add src/engine/git-sandbox/
git commit -m "feat(sandbox): add emulated remote, push, pull, fetch commands"
```

---

### Task 7: SandboxTerminal Component

**Files:**
- Create: `src/components/sandbox/SandboxTerminal.tsx`

Interactive terminal with command input, history (arrow up/down), autocomplete (Tab), and colored output.

Props:
```ts
interface SandboxTerminalProps {
  outputLines: Array<{ text: string; type: string }>;
  onExecute: (command: string) => void;
  getCompletions: (partial: string) => string[];
  insertCommand?: string; // From quick actions — pre-fills input
}
```

Features:
- Input field at bottom with `$` prompt
- Enter → call onExecute
- Arrow up/down → cycle history
- Tab → autocomplete from getCompletions
- Scrolls to bottom on new output
- Color-coded output lines (success=green, error=red, warning=amber, hint=yellow italic, info=white)
- Mac-style terminal header (red/yellow/green dots)

- [ ] **Step 1: Implement SandboxTerminal**
- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add src/components/sandbox/
git commit -m "feat(sandbox): add SandboxTerminal component with history and autocomplete"
```

---

### Task 8: SandboxFiles Component

**Files:**
- Create: `src/components/sandbox/SandboxFiles.tsx`

File browser panel showing working dir, staging area, and diff view.

Props:
```ts
interface SandboxFilesProps {
  workingDir: Array<{ path: string; content: string }>;
  stagingArea: Array<{ path: string; content: string }>;
}
```

Features:
- Two collapsible sections: "Working Directory" and "Staging Area"
- Files listed with status icons (colored dot: green=new, amber=modified, red=deleted)
- Click file → expand to show content in monospace
- Simple diff view: show +/- lines when file differs between working and staging

- [ ] **Step 1: Implement SandboxFiles**
- [ ] **Step 2: Verify build**
- [ ] **Step 3: Commit**

```bash
git add src/components/sandbox/
git commit -m "feat(sandbox): add SandboxFiles component with file browser and diff view"
```

---

### Task 9: QuickActions + SandboxLayout + Page

**Files:**
- Create: `src/components/sandbox/QuickActions.tsx`
- Create: `src/components/sandbox/SandboxLayout.tsx`
- Create: `src/app/sandbox/page.tsx`
- Modify: `src/components/ui/Navbar.tsx` — add Sandbox link

QuickActions: horizontal bar of buttons (git init, git add ., git commit, git branch, git merge, git log, git status, git diff). On click → insert command text into terminal input.

SandboxLayout: three-panel layout (terminal | graph | files) with responsive behavior. Wires up GitEngine state to all three panels.

Page: `/sandbox` route using SandboxLayout. Handles `?from=<levelId>` to preload state from level.

Navbar: add "Песочница" link between home and profile.

- [ ] **Step 1: Implement QuickActions**
- [ ] **Step 2: Implement SandboxLayout**
- [ ] **Step 3: Create sandbox page**
- [ ] **Step 4: Add Sandbox link to Navbar**
- [ ] **Step 5: Verify build and test manually**
- [ ] **Step 6: Commit**

```bash
git add src/components/sandbox/ src/app/sandbox/ src/components/ui/Navbar.tsx
git commit -m "feat(sandbox): add sandbox page with three-panel layout, quick actions, and navbar link"
```

---

### Task 10: Level Integration

**Files:**
- Modify: Multiple level files in `src/levels/*/Level.tsx`

Add "Открыть в песочнице" button to visualization step of the first 2 levels (01-init, 02-first-commit) as a proof of concept. The button links to `/sandbox?from=<levelId>`.

In the sandbox page, if `from` param is present, preload the engine with the level's initial state (execute the initial commands to set up the graph).

- [ ] **Step 1: Add sandbox button to level 01-init**
- [ ] **Step 2: Add sandbox button to level 02-first-commit**
- [ ] **Step 3: Handle `from` param in sandbox page**
- [ ] **Step 4: Verify build**
- [ ] **Step 5: Commit**

```bash
git add src/levels/ src/app/sandbox/
git commit -m "feat(sandbox): add 'Open in sandbox' button to levels with state preloading"
```

---

### Task 11: E2E Verification

- [ ] **Step 1: Run full build** — `npm run build`
- [ ] **Step 2: Run all tests** — `npx jest`
- [ ] **Step 3: Manual test flow:**
  1. Open /sandbox
  2. Type `git init` → graph stays empty, status works
  3. Type `echo "hello" > file.txt` → file appears in Files panel
  4. Type `git add file.txt` → file moves to staging
  5. Type `git commit -m "first"` → commit appears in graph
  6. Type `git branch feature` → branch label appears
  7. Type `git switch feature` → HEAD moves
  8. Type `echo "new" > new.txt && git add . && git commit -m "feature"` → new commit on feature
  9. Type `git switch main && git merge feature` → merge in graph
  10. Test quick action buttons
  11. Test autocomplete (Tab)
  12. Test command history (arrow up)
  13. Open level 01-init → click "Открыть в песочнице"
- [ ] **Step 4: Push to remote**

```bash
git push origin main
```
