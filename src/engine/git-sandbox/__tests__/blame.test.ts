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
