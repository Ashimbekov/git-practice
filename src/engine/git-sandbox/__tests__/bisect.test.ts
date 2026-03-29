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
