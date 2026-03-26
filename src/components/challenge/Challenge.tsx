"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChallengeTask } from "@/types";

interface ChallengeProps {
  task: ChallengeTask;
  onComplete: () => void;
}

export function Challenge({ task, onComplete }: ChallengeProps) {
  const [showHint, setShowHint] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(
    new Array(task.verificationSteps.length).fill(false)
  );

  const allChecked = checkedSteps.every(Boolean);

  function toggleStep(index: number) {
    setCheckedSteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
      <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-2">
        🏋️ Практика: {task.title}
      </h3>
      <p className="text-gray-300 text-sm mb-4">{task.description}</p>

      <div className="space-y-2 mb-4">
        <p className="text-sm font-medium text-gray-400">Чеклист проверки:</p>
        {task.verificationSteps.map((step, i) => (
          <label
            key={i}
            className="flex items-center gap-3 text-sm cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={checkedSteps[i]}
              onChange={() => toggleStep(i)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
            />
            <span className={checkedSteps[i] ? "text-gray-500 line-through" : "text-gray-300"}>
              {step}
            </span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          {showHint ? "Скрыть подсказку" : "💡 Показать подсказку"}
        </button>

        {allChecked && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onComplete}
            className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            Готово! ✅
          </motion.button>
        )}
      </div>

      {showHint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 p-3 bg-amber-500/5 rounded-lg text-sm text-amber-300/80 border border-amber-500/10"
        >
          💡 {task.hint}
        </motion.div>
      )}
    </div>
  );
}
