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
