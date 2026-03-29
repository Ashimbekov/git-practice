export interface FileEntry {
  path: string;
  content: string;
}

export type FileStatus = "untracked" | "modified" | "staged" | "deleted" | "conflict";

export interface FileStatusEntry {
  path: string;
  status: FileStatus;
  content: string;
}

export interface CommitObject {
  id: string;
  message: string;
  timestamp: number;
  parentId: string | null;
  secondParentId: string | null;
  snapshot: Map<string, string>;
  branch: string;
}

export interface RemoteState {
  branches: Map<string, string>;
  commits: CommitObject[];
}

export interface StashedState {
  message: string;
  workingDir: Map<string, string>;
  stagingArea: Map<string, string>;
}

export interface ReflogEntry {
  commitId: string;
  action: string;
  message: string;
}

export interface BisectState {
  active: boolean;
  goodCommits: string[];
  badCommits: string[];
  originalHead: string;
  originalIsDetached: boolean;
}

export interface EngineState {
  initialized: boolean;
  workingDir: Map<string, string>;
  stagingArea: Map<string, string>;
  commits: CommitObject[];
  branches: Map<string, string>;
  head: string;
  isDetached: boolean;
  remotes: Map<string, RemoteState>;
  stash: StashedState[];
  reflog: ReflogEntry[];
  conflictFiles: Map<string, { ours: string; theirs: string }>;
  tags: Map<string, string>;
  bisect: BisectState | null;
}

export interface CommandOutput {
  lines: OutputLine[];
}

export interface OutputLine {
  text: string;
  type: "info" | "success" | "error" | "warning" | "hint";
}

export interface ParsedCommand {
  raw: string;
  program: string;
  subcommand: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}
