"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { GitEngine } from "@/engine/git-sandbox/GitEngine";
import { EngineState, OutputLine } from "@/engine/git-sandbox/types";
import { SandboxTerminal } from "./SandboxTerminal";

export interface ValidationCheck {
  label: string;
  passed: boolean;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}

interface SandboxChallengeProps {
  description: string;
  hint?: string;
  preset?: () => EngineState;
  validate: (state: EngineState) => ValidationResult;
  onComplete: () => void;
}

export function SandboxChallenge({
  description,
  hint,
  preset,
  validate,
  onComplete,
}: SandboxChallengeProps) {
  const [engine] = useState(() => {
    const e = new GitEngine();
    if (preset) {
      e.state = preset();
    }
    return e;
  });

  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [validation, setValidation] = useState<ValidationResult>(() =>
    validate(engine.state)
  );
  const [showHint, setShowHint] = useState(false);

  const handleExecute = useCallback(
    (cmd: string) => {
      const result = engine.execute(cmd);
      setOutputLines((prev) => [
        ...prev,
        { text: `$ ${cmd}`, type: "info" as const },
        ...result.lines,
      ]);
      setValidation(validate(engine.state));
    },
    [engine, validate]
  );

  const getCompletions = useCallback(
    (partial: string) => engine.getCompletions(partial),
    [engine]
  );

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-2">
          🏋️ Практика
        </h3>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>

      {/* Terminal */}
      <div className="h-64 rounded-lg overflow-hidden">
        <SandboxTerminal
          outputLines={outputLines}
          onExecute={handleExecute}
          getCompletions={getCompletions}
        />
      </div>

      {/* Validation checklist */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-400">Проверки:</p>
        {validation.checks.map((check, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={check.passed ? "text-emerald-400" : "text-gray-600"}>
              {check.passed ? "✓" : "○"}
            </span>
            <span className={check.passed ? "text-gray-300" : "text-gray-500"}>
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 items-center">
        {hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            {showHint ? "Скрыть подсказку" : "💡 Подсказка"}
          </button>
        )}

        {validation.passed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onComplete}
            className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            Завершить
          </motion.button>
        )}
      </div>

      {showHint && hint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-3 bg-amber-500/5 rounded-lg text-sm text-amber-300/80 border border-amber-500/10"
        >
          💡 {hint}
        </motion.div>
      )}
    </div>
  );
}
