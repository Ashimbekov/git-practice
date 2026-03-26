"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";

interface OutputLine {
  text: string;
  type: "info" | "success" | "error" | "warning" | "hint";
}

interface SandboxTerminalProps {
  outputLines: OutputLine[];
  onExecute: (command: string) => void;
  getCompletions: (partial: string) => string[];
  insertCommand?: string;
}

const colorMap: Record<OutputLine["type"], string> = {
  info: "text-white",
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  hint: "text-yellow-300 italic",
};

export function SandboxTerminal({
  outputLines,
  onExecute,
  getCompletions,
  insertCommand,
}: SandboxTerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [completionLines, setCompletionLines] = useState<OutputLine[]>([]);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever outputLines or completionLines change
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputLines, completionLines]);

  // insertCommand effect — set input value from QuickActions
  useEffect(() => {
    if (insertCommand !== undefined && insertCommand !== "") {
      setInput(insertCommand);
      inputRef.current?.focus();
    }
  }, [insertCommand]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = input.trim();
      if (cmd) {
        setHistory((prev) => [cmd, ...prev]);
      }
      setHistoryIndex(-1);
      setCompletionLines([]);
      onExecute(cmd);
      setInput("");
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = Math.min(prev + 1, history.length - 1);
        setInput(history[next] ?? "");
        return next;
      });
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = prev - 1;
        if (next < 0) {
          setInput("");
          return -1;
        }
        setInput(history[next] ?? "");
        return next;
      });
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const completions = getCompletions(input);
      if (completions.length === 1) {
        setInput(completions[0]);
        setCompletionLines([]);
      } else if (completions.length > 1) {
        setCompletionLines([
          { text: completions.join("  "), type: "hint" },
        ]);
      }
      return;
    }
  }

  const allLines: OutputLine[] = [...outputLines, ...completionLines];

  return (
    <div className="h-full flex flex-col bg-[#0d1117] font-mono text-sm rounded-lg overflow-hidden">
      {/* Mac-style header */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#161b22] border-b border-white/5 shrink-0">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-gray-500 select-none">terminal</span>
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0"
        onClick={() => inputRef.current?.focus()}
      >
        {allLines.map((line, i) => (
          <div
            key={i}
            className={`leading-relaxed whitespace-pre-wrap break-all ${colorMap[line.type]}`}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5 shrink-0">
        <span className="text-emerald-400 select-none">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHistoryIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-white outline-none caret-emerald-400 placeholder-gray-600"
          placeholder="type a git command..."
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
    </div>
  );
}
