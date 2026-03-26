"use client";

import { useState } from "react";

interface FileEntry {
  path: string;
  content: string;
}

interface SandboxFilesProps {
  workingDir: Array<FileEntry>;
  stagingArea: Array<FileEntry>;
}

type FileStatus = "new" | "modified" | "deleted";

interface FileInfo {
  path: string;
  status: FileStatus;
  workingContent?: string;
  stagingContent?: string;
}

function computeFileList(
  workingDir: FileEntry[],
  stagingArea: FileEntry[]
): FileInfo[] {
  const workingMap = new Map(workingDir.map((f) => [f.path, f.content]));
  const stagingMap = new Map(stagingArea.map((f) => [f.path, f.content]));

  const allPaths = new Set([...workingMap.keys(), ...stagingMap.keys()]);
  const result: FileInfo[] = [];

  for (const path of allPaths) {
    const inWorking = workingMap.has(path);
    const inStaging = stagingMap.has(path);

    if (inWorking && !inStaging) {
      result.push({ path, status: "new", workingContent: workingMap.get(path) });
    } else if (!inWorking && inStaging) {
      result.push({ path, status: "deleted", stagingContent: stagingMap.get(path) });
    } else {
      const wContent = workingMap.get(path)!;
      const sContent = stagingMap.get(path)!;
      const status: FileStatus = wContent !== sContent ? "modified" : "new";
      result.push({
        path,
        status,
        workingContent: wContent,
        stagingContent: sContent,
      });
    }
  }

  return result;
}

const statusDotClass: Record<FileStatus, string> = {
  new: "bg-green-500",
  modified: "bg-amber-500",
  deleted: "bg-red-500",
};

const statusLabel: Record<FileStatus, string> = {
  new: "new",
  modified: "modified",
  deleted: "deleted",
};

function computeDiff(oldContent: string, newContent: string): { type: "added" | "removed" | "context"; line: string }[] {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  const result: { type: "added" | "removed" | "context"; line: string }[] = [];

  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const ops: { type: "added" | "removed" | "context"; line: string }[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.unshift({ type: "context", line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: "added", line: newLines[j - 1] });
      j--;
    } else {
      ops.unshift({ type: "removed", line: oldLines[i - 1] });
      i--;
    }
  }

  return ops;
}

interface FileRowProps {
  info: FileInfo;
  section: "working" | "staging";
}

function FileRow({ info, section }: FileRowProps) {
  const [expanded, setExpanded] = useState(false);

  const displayContent =
    section === "working" ? info.workingContent : info.stagingContent;

  const hasDiff =
    info.status === "modified" &&
    info.workingContent !== undefined &&
    info.stagingContent !== undefined;

  const diff = hasDiff
    ? computeDiff(info.stagingContent!, info.workingContent!)
    : null;

  const fileName = info.path.split("/").pop() ?? info.path;

  return (
    <div className="border border-white/5 rounded-md overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-gray-400 shrink-0">
          {expanded ? "▾" : "▸"}
        </span>
        <span className="text-gray-300 text-sm shrink-0">📄</span>
        <span className="text-gray-200 text-sm font-mono flex-1 truncate">
          {fileName}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${statusDotClass[info.status]}`}
          />
          <span
            className={`text-xs ${
              info.status === "new"
                ? "text-green-400"
                : info.status === "modified"
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {statusLabel[info.status]}
          </span>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-white/5">
          {displayContent !== undefined && (
            <pre className="px-3 py-2 text-xs font-mono text-gray-300 bg-black/30 overflow-x-auto whitespace-pre-wrap break-all">
              {displayContent}
            </pre>
          )}

          {hasDiff && diff && (
            <div className="border-t border-white/5">
              <div className="px-3 py-1 text-xs text-gray-500 bg-black/20 select-none">
                diff
              </div>
              <pre className="px-3 py-2 text-xs font-mono overflow-x-auto">
                {diff.map((entry, idx) => (
                  <div
                    key={idx}
                    className={
                      entry.type === "added"
                        ? "text-green-400"
                        : entry.type === "removed"
                        ? "text-red-400"
                        : "text-gray-500"
                    }
                  >
                    {entry.type === "added"
                      ? `+ ${entry.line}`
                      : entry.type === "removed"
                      ? `- ${entry.line}`
                      : `  ${entry.line}`}
                  </div>
                ))}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  files: FileInfo[];
  section: "working" | "staging";
}

function Section({ title, files, section }: SectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-1">
      <button
        className="flex items-center gap-2 px-1 py-1 text-sm text-gray-400 hover:text-gray-200 transition-colors text-left select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xs">{open ? "▾" : "▸"}</span>
        <span>{title}</span>
        <span className="ml-auto text-xs text-gray-600">{files.length}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-1 pl-2">
          {files.length === 0 ? (
            <p className="text-xs text-gray-600 px-3 py-2 italic">Нет файлов</p>
          ) : (
            files.map((info) => (
              <FileRow key={info.path} info={info} section={section} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function SandboxFiles({ workingDir, stagingArea }: SandboxFilesProps) {
  const workingFiles = computeFileList(workingDir, stagingArea);

  // For staging section: files that are in stagingArea
  const stagingFiles = computeFileList(stagingArea, workingDir);

  return (
    <div className="h-full overflow-y-auto bg-gray-900/50 flex flex-col gap-3 px-3 py-3 font-mono text-sm">
      <Section title="📁 Working Directory" files={workingFiles} section="working" />
      <Section title="📦 Staging Area" files={stagingFiles} section="staging" />
    </div>
  );
}
