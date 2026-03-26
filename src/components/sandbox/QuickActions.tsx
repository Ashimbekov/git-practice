"use client";

interface QuickActionsProps {
  onInsert: (command: string) => void;
  onReset: () => void;
}

const buttons = [
  { label: "git init", command: "git init" },
  { label: "git add .", command: "git add ." },
  { label: "git commit", command: 'git commit -m ""' },
  { label: "git status", command: "git status" },
  { label: "git log", command: "git log --oneline" },
  { label: "git branch", command: "git branch " },
  { label: "git switch", command: "git switch " },
  { label: "git merge", command: "git merge " },
  { label: "git diff", command: "git diff" },
];

export function QuickActions({ onInsert, onReset }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-3 scrollbar-thin scrollbar-thumb-gray-700">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => onInsert(btn.command)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors font-mono"
        >
          {btn.label}
        </button>
      ))}
      <button
        onClick={onReset}
        className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-red-900/50 text-red-300 hover:bg-red-800/60 hover:text-red-200 transition-colors font-medium"
      >
        Сбросить
      </button>
    </div>
  );
}
