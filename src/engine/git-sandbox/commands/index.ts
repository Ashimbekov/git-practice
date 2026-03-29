import { EngineState, CommandOutput, ParsedCommand } from "../types";
import { execInit, execAdd, execCommit, execStatus, execLog, execDiff } from "./basic";
import { execEcho, execCat, execLs, execRm } from "./filesystem";
import { execBranch, execSwitch, execCheckout, execMerge } from "./branch";
import { execReset, execRevert, execStash, execReflog, execCherryPick, execRebase } from "./advanced";
import { execRemote, execPush, execFetch, execPull } from "./remote";
import { execTag } from "./tag";
import { execBlame } from "./blame";
import { execBisect } from "./bisect";

type CommandHandler = (state: EngineState, cmd: ParsedCommand) => CommandOutput;

const gitCommands: Record<string, CommandHandler> = {
  init: execInit,
  add: execAdd,
  commit: execCommit,
  status: execStatus,
  log: execLog,
  diff: execDiff,
  branch: execBranch,
  switch: execSwitch,
  checkout: execCheckout,
  merge: execMerge,
  reset: execReset,
  revert: execRevert,
  stash: execStash,
  reflog: execReflog,
  "cherry-pick": execCherryPick,
  rebase: execRebase,
  remote: execRemote,
  push: execPush,
  fetch: execFetch,
  pull: execPull,
  tag: execTag,
  blame: execBlame,
  bisect: execBisect,
};

const shellCommands: Record<string, CommandHandler> = {
  echo: execEcho,
  cat: execCat,
  ls: execLs,
  rm: execRm,
};

export function executeCommand(state: EngineState, cmd: ParsedCommand): CommandOutput {
  if (!state.initialized && cmd.program === "git" && cmd.subcommand !== "init") {
    return {
      lines: [
        { text: "fatal: not a git repository", type: "error" },
        { text: "Hint: run git init first", type: "hint" },
      ],
    };
  }

  if (cmd.program === "git") {
    const handler = gitCommands[cmd.subcommand];
    if (!handler) {
      return {
        lines: [
          { text: `git: '${cmd.subcommand}' is not a git command`, type: "error" },
          { text: "Hint: available commands: init, add, commit, status, log, diff, branch, switch, merge, rebase, cherry-pick, reset, revert, stash, reflog, remote, push, pull, fetch", type: "hint" },
        ],
      };
    }
    return handler(state, cmd);
  }

  const handler = shellCommands[cmd.program];
  if (!handler) {
    return {
      lines: [{ text: `command not found: ${cmd.program}`, type: "error" }],
    };
  }
  return handler(state, cmd);
}

// Export for extending with more commands
export function registerGitCommand(name: string, handler: CommandHandler) {
  gitCommands[name] = handler;
}
