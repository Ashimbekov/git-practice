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
