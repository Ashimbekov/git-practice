import { GitEngine } from "../GitEngine";

describe("Branch & Merge Commands", () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "initial" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "initial commit"');
  });

  describe("git branch", () => {
    test("creates a new branch pointing to HEAD", () => {
      const result = engine.execute("git branch feature");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.branches.has("feature")).toBe(true);
      // The new branch should point to the same commit as main
      expect(engine.state.branches.get("feature")).toBe(
        engine.state.branches.get("main")
      );
    });

    test("lists branches with current branch marked", () => {
      engine.execute("git branch feature");
      engine.execute("git branch bugfix");
      const result = engine.execute("git branch");
      const texts = result.lines.map((l) => l.text);
      expect(texts).toContain("* main");
      expect(texts.some((t) => t === "  bugfix")).toBe(true);
      expect(texts.some((t) => t === "  feature")).toBe(true);
    });

    test("errors when creating a branch that already exists", () => {
      engine.execute("git branch feature");
      const result = engine.execute("git branch feature");
      expect(result.lines[0].type).toBe("error");
    });

    test("deletes a branch with -d", () => {
      engine.execute("git branch feature");
      const result = engine.execute("git branch -d feature");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.branches.has("feature")).toBe(false);
    });

    test("errors when deleting the current branch", () => {
      const result = engine.execute("git branch -d main");
      expect(result.lines[0].type).toBe("error");
    });
  });

  describe("git switch", () => {
    test("switches to an existing branch", () => {
      engine.execute("git branch feature");
      const result = engine.execute("git switch feature");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.head).toBe("feature");
    });

    test("updates workingDir and stagingArea from branch snapshot", () => {
      // Create a second commit on main
      engine.execute('echo "main content" > main.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "main file"');

      // Create feature branch pointing to first commit
      // (We need to switch back. Let's use a different approach.)
      // Create feature from current HEAD, switch to it, make changes there
      engine.execute("git switch -c feature");
      engine.execute('echo "feature content" > feature.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature file"');

      // Switch back to main - should not have feature.txt
      engine.execute("git switch main");
      expect(engine.state.workingDir.has("feature.txt")).toBe(false);
      expect(engine.state.workingDir.has("main.txt")).toBe(true);
    });

    test("creates and switches with -c flag", () => {
      const result = engine.execute("git switch -c feature");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.head).toBe("feature");
      expect(engine.state.branches.has("feature")).toBe(true);
    });

    test("errors when switching to a non-existent branch", () => {
      const result = engine.execute("git switch nonexistent");
      expect(result.lines[0].type).toBe("error");
    });
  });

  describe("git checkout", () => {
    test("switches to a branch (alias for switch)", () => {
      engine.execute("git branch feature");
      const result = engine.execute("git checkout feature");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.head).toBe("feature");
    });

    test("creates and switches with -b flag", () => {
      const result = engine.execute("git checkout -b feature");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.head).toBe("feature");
      expect(engine.state.branches.has("feature")).toBe(true);
    });

    test("enters detached HEAD when given a commit id", () => {
      const commitId = engine.state.commits[0].id;
      engine.execute('echo "second" > b.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "second"');

      const result = engine.execute(`git checkout ${commitId.slice(0, 7)}`);
      expect(engine.state.isDetached).toBe(true);
      expect(engine.state.head).toBe(commitId);
    });
  });

  describe("git merge", () => {
    test("fast-forward merge moves branch pointer", () => {
      // Create feature branch and add a commit on it
      engine.execute("git switch -c feature");
      engine.execute('echo "new file" > new.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature commit"');

      // Switch back to main and merge feature
      engine.execute("git switch main");
      const result = engine.execute("git merge feature");
      const texts = result.lines.map((l) => l.text).join("\n");
      expect(texts.toLowerCase()).toContain("fast-forward");

      // main should now point to the same commit as feature
      expect(engine.state.branches.get("main")).toBe(
        engine.state.branches.get("feature")
      );
      // working dir should have the new file
      expect(engine.state.workingDir.has("new.txt")).toBe(true);
    });

    test("3-way merge creates merge commit", () => {
      // Create feature branch
      engine.execute("git switch -c feature");
      engine.execute('echo "feature file" > feature.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature commit"');

      // Go back to main and make a different commit
      engine.execute("git switch main");
      engine.execute('echo "main file" > main.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "main commit"');

      const result = engine.execute("git merge feature");
      const texts = result.lines.map((l) => l.text).join("\n");
      expect(texts.toLowerCase()).toContain("merge");

      // Should have created a merge commit with secondParentId
      const headCommitId = engine.state.branches.get("main")!;
      const mergeCommit = engine.state.commits.find((c) => c.id === headCommitId);
      expect(mergeCommit).toBeDefined();
      expect(mergeCommit!.secondParentId).not.toBeNull();

      // working dir should have files from both branches
      expect(engine.state.workingDir.has("feature.txt")).toBe(true);
      expect(engine.state.workingDir.has("main.txt")).toBe(true);
    });

    test("merge conflict is detected when same file diverged", () => {
      // Modify file.txt differently on two branches
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
      expect(texts.toUpperCase()).toContain("CONFLICT");

      // conflictFiles should be populated
      expect(engine.state.conflictFiles.size).toBeGreaterThan(0);
      expect(engine.state.conflictFiles.has("file.txt")).toBe(true);

      // working dir should contain conflict markers
      const fileContent = engine.state.workingDir.get("file.txt")!;
      expect(fileContent).toContain("<<<<<<<");
      expect(fileContent).toContain("=======");
      expect(fileContent).toContain(">>>>>>>");
    });

    test("errors when merging non-existent branch", () => {
      const result = engine.execute("git merge nonexistent");
      expect(result.lines[0].type).toBe("error");
    });

    test("errors when merging current branch into itself", () => {
      const result = engine.execute("git merge main");
      expect(result.lines[0].type).toBe("error");
    });
  });
});
