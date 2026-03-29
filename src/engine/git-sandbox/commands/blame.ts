import { EngineState, CommandOutput, ParsedCommand, CommitObject } from "../types";
import { getReachableCommits } from "./basic";

export function execBlame(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const filePath = cmd.args[0];
  if (!filePath) {
    return { lines: [{ text: "fatal: no file specified", type: "error" }] };
  }

  const commits = getReachableCommits(state);
  if (commits.length === 0) {
    return { lines: [{ text: "fatal: no commits yet", type: "error" }] };
  }

  const headCommit = commits[0];
  const fileContent = headCommit.snapshot.get(filePath);
  if (fileContent === undefined) {
    return { lines: [{ text: `fatal: no such path '${filePath}' in HEAD`, type: "error" }] };
  }

  const currentLines = fileContent.split("\n");
  const blameResult = blameLines(currentLines, filePath, commits);

  const lines: CommandOutput["lines"] = blameResult.map((b, i) => ({
    text: `${b.commitId.slice(0, 7)} (You  ${b.message.padEnd(20).slice(0, 20)}) ${i + 1}) ${b.line}`,
    type: "info" as const,
  }));

  return { lines };
}

interface BlameLine {
  commitId: string;
  message: string;
  line: string;
}

function blameLines(
  currentLines: string[],
  filePath: string,
  commits: CommitObject[]
): BlameLine[] {
  const result: BlameLine[] = currentLines.map((line) => ({
    commitId: commits[0].id,
    message: commits[0].message,
    line,
  }));

  for (let lineIdx = 0; lineIdx < currentLines.length; lineIdx++) {
    const targetLine = currentLines[lineIdx];

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const content = commit.snapshot.get(filePath);
      const commitLines = content ? content.split("\n") : [];

      if (!commitLines.includes(targetLine)) {
        if (i > 0) {
          result[lineIdx] = {
            commitId: commits[i - 1].id,
            message: commits[i - 1].message,
            line: targetLine,
          };
        }
        break;
      }

      if (i === commits.length - 1) {
        result[lineIdx] = {
          commitId: commit.id,
          message: commit.message,
          line: targetLine,
        };
      }
    }
  }

  return result;
}
