"use client";

import { useState, useCallback } from "react";
import { GitEngine } from "@/engine/git-sandbox/GitEngine";
import { OutputLine } from "@/engine/git-sandbox/types";
import { SandboxTerminal } from "./SandboxTerminal";
import { SandboxFiles } from "./SandboxFiles";
import { QuickActions } from "./QuickActions";
import { GitVisualizer } from "@/components/git-visualizer";
import { GitCommitNode } from "@/types";

type TabId = "terminal" | "graph" | "files";

interface SandboxLayoutProps {
  levelId?: string;
}

const SANDBOX_KEY = "gitquest-sandbox";

function getSandboxKey(levelId?: string): string {
  return levelId ? `gitquest-sandbox-level-${levelId}` : SANDBOX_KEY;
}

interface SandboxSave {
  engineState: string;
  outputLines: OutputLine[];
  savedAt: number;
}

function saveSandbox(key: string, engine: GitEngine, outputLines: OutputLine[]) {
  try {
    const data: SandboxSave = {
      engineState: engine.serialize(),
      outputLines,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function loadSandbox(key: string): SandboxSave | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SandboxSave;
  } catch {
    return null;
  }
}

export function SandboxLayout({ levelId }: SandboxLayoutProps) {
  const [engine] = useState(() => {
    const key = getSandboxKey(levelId);
    const saved = loadSandbox(key);
    if (saved) {
      try {
        return GitEngine.deserialize(saved.engineState);
      } catch {
        return new GitEngine();
      }
    }
    return new GitEngine();
  });

  const [outputLines, setOutputLines] = useState<OutputLine[]>(() => {
    const key = getSandboxKey(levelId);
    const saved = loadSandbox(key);
    return saved?.outputLines ?? [];
  });
  const [files, setFiles] = useState<{
    working: Array<{ path: string; content: string }>;
    staging: Array<{ path: string; content: string }>;
  }>({ working: [], staging: [] });
  const [graphCommits, setGraphCommits] = useState<GitCommitNode[]>([]);
  const [insertCommand, setInsertCommand] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("terminal");

  const refreshState = useCallback(() => {
    setFiles(engine.getFiles());
    const graphData = engine.getGraphData();
    setGraphCommits(graphData.commits);
  }, [engine]);

  const handleExecute = useCallback(
    (cmd: string) => {
      const result = engine.execute(cmd);

      setOutputLines((prev) => {
        const newLines = [
          ...prev,
          { text: `$ ${cmd}`, type: "info" as const },
          ...result.lines,
        ];
        saveSandbox(getSandboxKey(levelId), engine, newLines);
        return newLines;
      });

      refreshState();
    },
    [engine, refreshState, levelId]
  );

  const handleReset = useCallback(() => {
    engine.reset();
    setOutputLines([]);
    setInsertCommand("");
    refreshState();
    localStorage.removeItem(getSandboxKey(levelId));
  }, [engine, refreshState, levelId]);

  const handleInsert = useCallback((command: string) => {
    // Force re-trigger even if same command by appending invisible token
    setInsertCommand(command);
    // Reset after a tick so the same command can be inserted again
    setTimeout(() => setInsertCommand(""), 0);
  }, []);

  const getCompletions = useCallback((partial: string) => {
    return engine.getCompletions(partial);
  }, [engine]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "terminal", label: "Терминал" },
    { id: "graph", label: "Граф" },
    { id: "files", label: "Файлы" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Quick Actions bar */}
      <div className="shrink-0 border-b border-white/5 bg-gray-950/50">
        <QuickActions onInsert={handleInsert} onReset={handleReset} />
      </div>

      {/* Mobile tabs (below lg) */}
      <div className="lg:hidden flex border-b border-white/5 bg-gray-950/50 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop three-panel layout */}
      <div className="flex-1 min-h-0 hidden lg:flex">
        {/* Left: Terminal */}
        <div className="flex-1 min-w-0 p-2">
          <SandboxTerminal
            outputLines={outputLines}
            onExecute={handleExecute}
            getCompletions={getCompletions}
            insertCommand={insertCommand}
          />
        </div>

        {/* Center: Git Graph */}
        <div className="w-80 xl:w-96 shrink-0 p-2 border-l border-white/5">
          <GitVisualizer
            initial={graphCommits}
            steps={[]}
            currentStep={0}
          />
        </div>

        {/* Right: Files */}
        <div className="w-72 xl:w-80 shrink-0 border-l border-white/5">
          <SandboxFiles
            workingDir={files.working}
            stagingArea={files.staging}
          />
        </div>
      </div>

      {/* Mobile single-panel layout */}
      <div className="flex-1 min-h-0 lg:hidden">
        {activeTab === "terminal" && (
          <div className="h-full p-2">
            <SandboxTerminal
              outputLines={outputLines}
              onExecute={handleExecute}
              getCompletions={getCompletions}
              insertCommand={insertCommand}
            />
          </div>
        )}
        {activeTab === "graph" && (
          <div className="h-full p-2">
            <GitVisualizer
              initial={graphCommits}
              steps={[]}
              currentStep={0}
            />
          </div>
        )}
        {activeTab === "files" && (
          <div className="h-full">
            <SandboxFiles
              workingDir={files.working}
              stagingArea={files.staging}
            />
          </div>
        )}
      </div>
    </div>
  );
}
