import { GitEngine } from "../GitEngine";

describe("Remote Commands", () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine();
    engine.execute("git init");
    engine.execute('echo "initial" > file.txt');
    engine.execute("git add .");
    engine.execute('git commit -m "initial commit"');
  });

  // -------------------------------------------------------------------------
  // git remote
  // -------------------------------------------------------------------------
  describe("git remote add", () => {
    test("adds a remote and reports success", () => {
      const result = engine.execute("git remote add origin https://github.com/user/repo.git");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.remotes.has("origin")).toBe(true);
    });

    test("new remote has empty branches and commits", () => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
      const remote = engine.state.remotes.get("origin")!;
      expect(remote.branches.size).toBe(0);
      expect(remote.commits.length).toBe(0);
    });

    test("errors when adding a duplicate remote", () => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
      const result = engine.execute("git remote add origin https://github.com/user/repo.git");
      expect(result.lines[0].type).toBe("error");
    });

    test("errors when name or url is missing", () => {
      const result = engine.execute("git remote add origin");
      expect(result.lines[0].type).toBe("error");
    });
  });

  describe("git remote -v", () => {
    test("lists remotes with fetch and push entries", () => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
      const result = engine.execute("git remote -v");
      const texts = result.lines.map((l) => l.text);
      expect(texts.some((t) => t.includes("origin") && t.includes("fetch"))).toBe(true);
      expect(texts.some((t) => t.includes("origin") && t.includes("push"))).toBe(true);
    });

    test("shows message when no remotes are configured", () => {
      const result = engine.execute("git remote -v");
      expect(result.lines[0].type).toBe("info");
    });
  });

  describe("git remote (no args)", () => {
    test("lists remote names", () => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
      engine.execute("git remote add upstream https://github.com/other/repo.git");
      const result = engine.execute("git remote");
      const texts = result.lines.map((l) => l.text);
      expect(texts).toContain("origin");
      expect(texts).toContain("upstream");
    });

    test("returns empty lines when no remotes", () => {
      const result = engine.execute("git remote");
      expect(result.lines.length).toBe(0);
    });
  });

  describe("git remote remove", () => {
    test("removes an existing remote", () => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
      const result = engine.execute("git remote remove origin");
      expect(result.lines[0].type).toBe("success");
      expect(engine.state.remotes.has("origin")).toBe(false);
    });

    test("also removes tracking branches for that remote", () => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
      engine.execute("git push origin main");
      // origin/main tracking branch should exist after push
      expect(engine.state.branches.has("origin/main")).toBe(true);

      engine.execute("git remote remove origin");
      expect(engine.state.branches.has("origin/main")).toBe(false);
    });

    test("errors when remote does not exist", () => {
      const result = engine.execute("git remote remove nonexistent");
      expect(result.lines[0].type).toBe("error");
    });
  });

  // -------------------------------------------------------------------------
  // git push
  // -------------------------------------------------------------------------
  describe("git push", () => {
    beforeEach(() => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
    });

    test("copies all reachable commits to remote", () => {
      engine.execute('echo "second" > file2.txt');
      engine.execute("git add .");
      engine.execute('git commit -m "second commit"');

      engine.execute("git push origin main");
      const remote = engine.state.remotes.get("origin")!;
      // Both commits should now be in the remote
      expect(remote.commits.length).toBe(2);
    });

    test("updates remote branch pointer", () => {
      engine.execute("git push origin main");
      const remote = engine.state.remotes.get("origin")!;
      const expectedId = engine.state.branches.get("main")!;
      expect(remote.branches.get("main")).toBe(expectedId);
    });

    test("creates local tracking branch origin/main", () => {
      engine.execute("git push origin main");
      expect(engine.state.branches.has("origin/main")).toBe(true);
      expect(engine.state.branches.get("origin/main")).toBe(
        engine.state.branches.get("main")
      );
    });

    test("reports number of commits sent", () => {
      const result = engine.execute("git push origin main");
      expect(result.lines[0].type).toBe("success");
      expect(result.lines[0].text).toContain("1");
    });

    test("sends 0 new commits when remote is already up-to-date", () => {
      engine.execute("git push origin main");
      const result = engine.execute("git push origin main");
      expect(result.lines[0].text).toContain("0");
    });

    test("errors when remote does not exist", () => {
      const result = engine.execute("git push upstream main");
      expect(result.lines[0].type).toBe("error");
    });

    test("errors when branch does not exist", () => {
      const result = engine.execute("git push origin nonexistent");
      expect(result.lines[0].type).toBe("error");
    });

    test("errors when arguments are missing", () => {
      const result = engine.execute("git push origin");
      expect(result.lines[0].type).toBe("error");
    });
  });

  // -------------------------------------------------------------------------
  // git fetch
  // -------------------------------------------------------------------------
  describe("git fetch", () => {
    beforeEach(() => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
      // Push initial commit to remote
      engine.execute("git push origin main");
    });

    test("fetches new commits from remote into local commits", () => {
      // Simulate another commit added directly on the remote
      const remote = engine.state.remotes.get("origin")!;
      const existingCommit = remote.commits[0];
      const newRemoteCommit = {
        id: "remoteabc",
        message: "remote-only commit",
        timestamp: Date.now(),
        parentId: existingCommit.id,
        secondParentId: null,
        snapshot: new Map(existingCommit.snapshot),
        branch: "main",
      };
      remote.commits.push(newRemoteCommit);
      remote.branches.set("main", "remoteabc");

      const result = engine.execute("git fetch origin");
      expect(result.lines[0].type).toBe("success");
      expect(result.lines[0].text).toContain("1");
      expect(engine.state.commits.some((c) => c.id === "remoteabc")).toBe(true);
    });

    test("creates/updates tracking branch after fetch", () => {
      const remote = engine.state.remotes.get("origin")!;
      // Manually advance the remote branch
      const newId = "remotedef";
      remote.commits.push({
        id: newId,
        message: "another remote commit",
        timestamp: Date.now(),
        parentId: remote.commits[0].id,
        secondParentId: null,
        snapshot: new Map(),
        branch: "main",
      });
      remote.branches.set("main", newId);

      engine.execute("git fetch origin");
      expect(engine.state.branches.get("origin/main")).toBe(newId);
    });

    test("reports 0 new commits when already up to date", () => {
      const result = engine.execute("git fetch origin");
      expect(result.lines[0].type).toBe("info");
      expect(result.lines[0].text).toContain("0");
    });

    test("errors when remote does not exist", () => {
      const result = engine.execute("git fetch upstream");
      expect(result.lines[0].type).toBe("error");
    });

    test("errors when no remote argument provided", () => {
      const result = engine.execute("git fetch");
      expect(result.lines[0].type).toBe("error");
    });
  });

  // -------------------------------------------------------------------------
  // git pull
  // -------------------------------------------------------------------------
  describe("git pull", () => {
    beforeEach(() => {
      engine.execute("git remote add origin https://github.com/user/repo.git");
      engine.execute("git push origin main");
    });

    test("fetches and merges remote commits into current branch", () => {
      // Put a new commit on the remote
      const remote = engine.state.remotes.get("origin")!;
      const latestId = remote.branches.get("main")!;
      const latestCommit = remote.commits.find((c) => c.id === latestId)!;
      const newSnapshot = new Map(latestCommit.snapshot);
      newSnapshot.set("remote-file.txt", "from remote");
      const newId = "pulltest1";
      remote.commits.push({
        id: newId,
        message: "remote pull commit",
        timestamp: Date.now(),
        parentId: latestId,
        secondParentId: null,
        snapshot: newSnapshot,
        branch: "main",
      });
      remote.branches.set("main", newId);

      const result = engine.execute("git pull origin main");
      const texts = result.lines.map((l) => l.text).join("\n");
      // Should include fetch output and merge/fast-forward output
      expect(texts).toContain("1");
      // The local main branch should now point to the remote commit
      expect(engine.state.branches.get("main")).toBe(newId);
    });

    test("errors when remote does not exist", () => {
      const result = engine.execute("git pull upstream main");
      expect(result.lines[0].type).toBe("error");
    });

    test("errors when arguments are missing", () => {
      const result = engine.execute("git pull origin");
      expect(result.lines[0].type).toBe("error");
    });
  });
});
