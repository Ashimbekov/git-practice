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
