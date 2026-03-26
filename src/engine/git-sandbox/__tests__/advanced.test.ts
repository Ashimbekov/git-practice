import { GitEngine } from "../GitEngine";

describe("Advanced Commands", () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "initial" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "initial commit"');
  });

  // -----------------------------------------------------------------------
  // git reset
  // -----------------------------------------------------------------------
  describe("git reset", () => {
    beforeEach(() => {
      engine.execute('echo "second" > file.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "second commit"');
    });

    test("--soft moves HEAD but keeps staging and working dir", () => {
      const secondCommitId = engine.state.branches.get("main")!;
      const firstCommitId = engine.state.commits[0].id;

      engine.execute("git reset --soft HEAD~1");

      // Branch pointer moved to first commit
      expect(engine.state.branches.get("main")).toBe(firstCommitId);
      // Staging still has "second" content
      expect(engine.state.stagingArea.get("file.txt")).toBe("second");
      // Working dir still has "second" content
      expect(engine.state.workingDir.get("file.txt")).toBe("second");
    });

    test("--mixed moves HEAD and resets staging but keeps working dir", () => {
      const firstCommitId = engine.state.commits[0].id;

      engine.execute("git reset --mixed HEAD~1");

      expect(engine.state.branches.get("main")).toBe(firstCommitId);
      // Staging reset to first commit's snapshot
      expect(engine.state.stagingArea.get("file.txt")).toBe("initial");
      // Working dir still has "second" content
      expect(engine.state.workingDir.get("file.txt")).toBe("second");
    });

    test("default (no flag) behaves as --mixed", () => {
      const firstCommitId = engine.state.commits[0].id;

      engine.execute("git reset HEAD~1");

      expect(engine.state.branches.get("main")).toBe(firstCommitId);
      expect(engine.state.stagingArea.get("file.txt")).toBe("initial");
      expect(engine.state.workingDir.get("file.txt")).toBe("second");
    });

    test("--hard moves HEAD and resets staging and working dir", () => {
      const firstCommitId = engine.state.commits[0].id;

      engine.execute("git reset --hard HEAD~1");

      expect(engine.state.branches.get("main")).toBe(firstCommitId);
      expect(engine.state.stagingArea.get("file.txt")).toBe("initial");
      expect(engine.state.workingDir.get("file.txt")).toBe("initial");
    });

    test("adds a reflog entry", () => {
      const before = engine.state.reflog.length;
      engine.execute("git reset --soft HEAD~1");
      expect(engine.state.reflog.length).toBe(before + 1);
      expect(engine.state.reflog[0].action).toBe("reset");
    });

    test("errors on unknown ref", () => {
      const result = engine.execute("git reset --hard nonexistent");
      expect(result.lines[0].type).toBe("error");
    });
  });

  // -----------------------------------------------------------------------
  // git revert
  // -----------------------------------------------------------------------
  describe("git revert", () => {
    test("creates an inverse commit undoing target changes", () => {
      // Make a second commit adding a file
      engine.execute('echo "new" > new.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "add new.txt"');

      const addCommitId = engine.state.commits[1].id;
      const commitsBefore = engine.state.commits.length;

      const result = engine.execute(`git revert ${addCommitId}`);
      expect(result.lines[0].type).toBe("success");
      expect(result.lines[0].text).toContain("Revert:");

      // New commit was created
      expect(engine.state.commits.length).toBe(commitsBefore + 1);

      // The new.txt file should be removed (inverse of adding it)
      expect(engine.state.workingDir.has("new.txt")).toBe(false);
      expect(engine.state.stagingArea.has("new.txt")).toBe(false);
    });

    test("reverts a modification", () => {
      engine.execute('echo "modified" > file.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "modify file.txt"');

      const modifyCommitId = engine.state.commits[1].id;
      engine.execute(`git revert ${modifyCommitId}`);

      // file.txt should be reverted to "initial"
      expect(engine.state.workingDir.get("file.txt")).toBe("initial");
    });

    test("errors on missing commit", () => {
      const result = engine.execute("git revert nonexistent");
      expect(result.lines[0].type).toBe("error");
    });

    test("adds a reflog entry", () => {
      engine.execute('echo "new" > new.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "add new.txt"');
      const addCommitId = engine.state.commits[1].id;

      const before = engine.state.reflog.length;
      engine.execute(`git revert ${addCommitId}`);
      expect(engine.state.reflog.length).toBe(before + 1);
      expect(engine.state.reflog[0].action).toBe("revert");
    });
  });

  // -----------------------------------------------------------------------
  // git stash
  // -----------------------------------------------------------------------
  describe("git stash", () => {
    test("saves working dir and staging changes, restores to last commit", () => {
      engine.execute('echo "dirty" > file.txt');
      engine.execute('echo "untracked" > new.txt');
      engine.execute("git add new.txt");

      const result = engine.execute("git stash");
      expect(result.lines[0].type).toBe("success");

      // Working dir and staging should be restored to last commit snapshot
      expect(engine.state.workingDir.get("file.txt")).toBe("initial");
      expect(engine.state.workingDir.has("new.txt")).toBe(false);
      expect(engine.state.stagingArea.get("file.txt")).toBe("initial");

      // Stash stack should have one entry
      expect(engine.state.stash.length).toBe(1);
    });

    test("pop restores stashed state and removes from stack", () => {
      engine.execute('echo "dirty" > file.txt');
      engine.execute("git stash");

      expect(engine.state.workingDir.get("file.txt")).toBe("initial");

      const result = engine.execute("git stash pop");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.workingDir.get("file.txt")).toBe("dirty");
      expect(engine.state.stash.length).toBe(0);
    });

    test("apply restores stashed state but keeps it on stack", () => {
      engine.execute('echo "dirty" > file.txt');
      engine.execute("git stash");

      const result = engine.execute("git stash apply");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.workingDir.get("file.txt")).toBe("dirty");
      // Stash still has the entry
      expect(engine.state.stash.length).toBe(1);
    });

    test("list shows stash entries", () => {
      engine.execute('echo "dirty1" > file.txt');
      engine.execute("git stash");
      engine.execute('echo "dirty2" > file.txt');
      engine.execute("git stash");

      const result = engine.execute("git stash list");
      expect(result.lines.length).toBe(2);
      expect(result.lines[0].text).toContain("stash@{0}");
      expect(result.lines[1].text).toContain("stash@{1}");
    });

    test("pop on empty stash returns error", () => {
      const result = engine.execute("git stash pop");
      expect(result.lines[0].type).toBe("error");
    });

    test("stash with no changes shows warning", () => {
      const result = engine.execute("git stash");
      expect(result.lines[0].type).toBe("warning");
    });
  });

  // -----------------------------------------------------------------------
  // git reflog
  // -----------------------------------------------------------------------
  describe("git reflog", () => {
    test("shows reflog entries from commits", () => {
      // The initial commit in beforeEach already created a reflog entry
      const result = engine.execute("git reflog");
      expect(result.lines.length).toBeGreaterThan(0);
      expect(result.lines[0].text).toContain("commit");
    });

    test("shows entries from multiple operations", () => {
      engine.execute("git switch -c feature");
      engine.execute('echo "f" > f.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature"');

      const result = engine.execute("git reflog");
      // Should have entries for: initial commit, switch, feature commit
      expect(result.lines.length).toBeGreaterThanOrEqual(3);
    });

    test("shows empty message when no entries", () => {
      // Create a fresh engine with no commits
      const freshEngine = new GitEngine();
      freshEngine.execute("git init");
      const result = freshEngine.execute("git reflog");
      expect(result.lines[0].text).toContain("No reflog entries");
    });
  });

  // -----------------------------------------------------------------------
  // git cherry-pick
  // -----------------------------------------------------------------------
  describe("git cherry-pick", () => {
    test("copies a commit from another branch", () => {
      // Create a feature branch with a new file
      engine.execute("git switch -c feature");
      engine.execute('echo "cherry" > cherry.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "add cherry"');

      const cherryCommitId = engine.state.branches.get("feature")!;

      // Switch back to main
      engine.execute("git switch main");
      expect(engine.state.workingDir.has("cherry.txt")).toBe(false);

      // Cherry-pick the commit
      const result = engine.execute(`git cherry-pick ${cherryCommitId}`);
      expect(result.lines[0].type).toBe("success");
      expect(result.lines[0].text).toContain("add cherry");

      // File should now exist on main
      expect(engine.state.workingDir.has("cherry.txt")).toBe(true);
      expect(engine.state.workingDir.get("cherry.txt")).toBe("cherry");

      // New commit was created (different id from original)
      const mainCommitId = engine.state.branches.get("main")!;
      expect(mainCommitId).not.toBe(cherryCommitId);

      // But same message
      const newCommit = engine.state.commits.find(
        (c) => c.id === mainCommitId,
      );
      expect(newCommit?.message).toBe("add cherry");
    });

    test("errors on missing commit", () => {
      const result = engine.execute("git cherry-pick nonexistent");
      expect(result.lines[0].type).toBe("error");
    });

    test("adds a reflog entry", () => {
      engine.execute("git switch -c feature");
      engine.execute('echo "cherry" > cherry.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "add cherry"');
      const cherryCommitId = engine.state.branches.get("feature")!;
      engine.execute("git switch main");

      const before = engine.state.reflog.length;
      engine.execute(`git cherry-pick ${cherryCommitId}`);
      expect(engine.state.reflog.length).toBe(before + 1);
      expect(engine.state.reflog[0].action).toBe("cherry-pick");
    });
  });

  // -----------------------------------------------------------------------
  // git rebase
  // -----------------------------------------------------------------------
  describe("git rebase", () => {
    test("replays commits onto target branch", () => {
      // Create feature branch with a commit
      engine.execute("git switch -c feature");
      engine.execute('echo "feat" > feat.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature work"');

      // Go back to main and make a commit
      engine.execute("git switch main");
      engine.execute('echo "main2" > main2.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "main advance"');

      // Switch to feature and rebase onto main
      engine.execute("git switch feature");
      const result = engine.execute("git rebase main");

      expect(result.lines[0].type).toBe("success");
      expect(result.lines[0].text).toContain("Successfully rebased");

      // Feature branch should now have both main2.txt and feat.txt
      expect(engine.state.workingDir.has("main2.txt")).toBe(true);
      expect(engine.state.workingDir.has("feat.txt")).toBe(true);
      expect(engine.state.workingDir.has("file.txt")).toBe(true);
    });

    test("creates new commits with new ids but same messages", () => {
      engine.execute("git switch -c feature");
      engine.execute('echo "feat" > feat.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature work"');

      const oldFeatureCommitId = engine.state.branches.get("feature")!;

      engine.execute("git switch main");
      engine.execute('echo "main2" > main2.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "main advance"');

      engine.execute("git switch feature");
      engine.execute("git rebase main");

      const newFeatureCommitId = engine.state.branches.get("feature")!;

      // New commit id should be different
      expect(newFeatureCommitId).not.toBe(oldFeatureCommitId);

      // But the message should be the same
      const newCommit = engine.state.commits.find(
        (c) => c.id === newFeatureCommitId,
      );
      expect(newCommit?.message).toBe("feature work");

      // Parent of the new feature commit should be the main advance commit
      const mainCommitId = engine.state.branches.get("main")!;
      expect(newCommit?.parentId).toBe(mainCommitId);
    });

    test("handles already up-to-date scenario", () => {
      const result = engine.execute("git rebase main");
      expect(result.lines[0].text).toContain("up to date");
    });

    test("errors on non-existent branch", () => {
      const result = engine.execute("git rebase nonexistent");
      expect(result.lines[0].type).toBe("error");
    });

    test("adds a reflog entry", () => {
      engine.execute("git switch -c feature");
      engine.execute('echo "feat" > feat.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature work"');

      engine.execute("git switch main");
      engine.execute('echo "main2" > main2.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "main advance"');

      engine.execute("git switch feature");
      const before = engine.state.reflog.length;
      engine.execute("git rebase main");
      expect(engine.state.reflog.length).toBe(before + 1);
      expect(engine.state.reflog[0].action).toBe("rebase");
    });

    test("replays multiple commits in order", () => {
      engine.execute("git switch -c feature");
      engine.execute('echo "f1" > f1.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature 1"');
      engine.execute('echo "f2" > f2.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "feature 2"');

      engine.execute("git switch main");
      engine.execute('echo "main2" > main2.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "main advance"');

      engine.execute("git switch feature");
      const result = engine.execute("git rebase main");
      expect(result.lines[1].text).toContain("2 commit(s)");

      // All files should be present
      expect(engine.state.workingDir.has("f1.txt")).toBe(true);
      expect(engine.state.workingDir.has("f2.txt")).toBe(true);
      expect(engine.state.workingDir.has("main2.txt")).toBe(true);
    });
  });
});
