import { EngineState, CommandOutput, ParsedCommand } from "../types";

export function execEcho(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const content = cmd.args[0] ?? "";
  const target = cmd.flags[">"];

  if (typeof target === "string") {
    state.workingDir.set(target, content);
    return { lines: [] };
  }

  return { lines: [{ text: content, type: "info" }] };
}

export function execCat(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const path = cmd.args[0];
  if (!path) {
    return { lines: [{ text: "cat: missing file operand", type: "error" }] };
  }

  const content = state.workingDir.get(path);
  if (content === undefined) {
    return { lines: [{ text: `cat: ${path}: No such file`, type: "error" }] };
  }

  return { lines: content.split("\n").map((line) => ({ text: line, type: "info" as const })) };
}

export function execLs(state: EngineState): CommandOutput {
  const files = [...state.workingDir.keys()].sort();
  return { lines: files.map((f) => ({ text: f, type: "info" as const })) };
}

export function execRm(state: EngineState, cmd: ParsedCommand): CommandOutput {
  const path = cmd.args[0];
  if (!path) {
    return { lines: [{ text: "rm: missing operand", type: "error" }] };
  }

  if (!state.workingDir.has(path)) {
    return { lines: [{ text: `rm: ${path}: No such file`, type: "error" }] };
  }

  state.workingDir.delete(path);
  return { lines: [] };
}
