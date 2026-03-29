import { EngineState, CommandOutput, ParsedCommand } from "../types";
import { getCurrentCommitId, getCommitById } from "./basic";

export function execTag(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const isDelete = cmd.flags["d"] === true;

  // git tag -d <name>
  if (isDelete) {
    const name = cmd.args[0];
    if (!name) {
      return { lines: [{ text: "fatal: tag name required", type: "error" }] };
    }
    if (!state.tags.has(name)) {
      return { lines: [{ text: `error: tag '${name}' not found`, type: "error" }] };
    }
    state.tags.delete(name);
    return { lines: [{ text: `Deleted tag '${name}'`, type: "success" }] };
  }

  // git tag (list)
  if (cmd.args.length === 0) {
    if (state.tags.size === 0) {
      return { lines: [{ text: "No tags", type: "info" }] };
    }
    const lines: CommandOutput["lines"] = [];
    for (const name of [...state.tags.keys()].sort()) {
      lines.push({ text: name, type: "info" });
    }
    return { lines };
  }

  // git tag <name> [commit]
  const name = cmd.args[0];
  if (state.tags.has(name)) {
    return { lines: [{ text: `fatal: tag '${name}' already exists`, type: "error" }] };
  }

  let commitId: string | null;
  if (cmd.args[1]) {
    const commit = getCommitById(state, cmd.args[1]);
    if (!commit) {
      return { lines: [{ text: `fatal: not a valid object name: '${cmd.args[1]}'`, type: "error" }] };
    }
    commitId = commit.id;
  } else {
    commitId = getCurrentCommitId(state);
    if (!commitId) {
      return { lines: [{ text: "fatal: no commits to tag", type: "error" }] };
    }
  }

  state.tags.set(name, commitId);
  return { lines: [{ text: `Created tag '${name}' at ${commitId.slice(0, 7)}`, type: "success" }] };
}
