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
