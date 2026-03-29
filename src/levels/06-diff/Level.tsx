"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NarrativeBox } from "@/components/narrative";
import { TerminalSim } from "@/components/terminal-sim";
import { GitVisualizer } from "@/components/git-visualizer";
import { Quiz } from "@/components/quiz";
import { Challenge } from "@/components/challenge";
import {
  QuizQuestion,
  ChallengeTask,
  GitCommitNode,
  GitVisualizerStep,
} from "@/types";

type Step = "narrative" | "visualization" | "quiz" | "challenge";

const STEPS: Step[] = ["narrative", "visualization", "quiz", "challenge"];

const terminalLines = [
  { text: "# Изменяем файл app.js", type: "output" as const },
  { text: "# (было: 3 строки, стало: 5 строк)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Смотрим изменения в рабочей копии (не в staging)", type: "output" as const },
  { text: "git diff", type: "command" as const },
  { text: "diff --git a/app.js b/app.js", type: "output" as const },
  { text: "index 8a3f2b1..c9d4e5f 100644", type: "output" as const },
  { text: "--- a/app.js", type: "output" as const },
  { text: "+++ b/app.js", type: "output" as const },
  { text: "@@ -1,3 +1,5 @@", type: "output" as const },
  { text: " const express = require('express');", type: "output" as const },
  { text: "-const port = 3000;", type: "error" as const },
  { text: "+const PORT = process.env.PORT || 3000;", type: "success" as const },
  { text: "+", type: "success" as const },
  { text: "+// Server configuration", type: "success" as const },
  { text: " app.listen(port);", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Добавляем в staging area", type: "output" as const },
  { text: "git add app.js", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# git diff теперь пуст! Изменения уже в staging", type: "output" as const },
  { text: "git diff", type: "command" as const },
  { text: "(no output — all changes are staged)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Смотрим что в staging (что войдёт в коммит)", type: "output" as const },
  { text: "git diff --staged", type: "command" as const },
  { text: "diff --git a/app.js b/app.js", type: "output" as const },
  { text: "--- a/app.js", type: "output" as const },
  { text: "+++ b/app.js", type: "output" as const },
  { text: "@@ -1,3 +1,5 @@", type: "output" as const },
  { text: " const express = require('express');", type: "output" as const },
  { text: "-const port = 3000;", type: "error" as const },
  { text: "+const PORT = process.env.PORT || 3000;", type: "success" as const },
  { text: "+", type: "success" as const },
  { text: "+// Server configuration", type: "success" as const },
  { text: " app.listen(port);", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "chore: initial project setup", branch: "main" },
  { id: "b2c3d4e", message: "feat: add express server", branch: "main" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Рабочая копия изменена, git diff показывает разницу",
    narration: "Файл изменён в рабочей копии. git diff сравнивает рабочую копию с последним состоянием в staging area (или последним коммитом). Красные строки (-) удалены, зелёные (+) добавлены.",
    addBranches: [{ name: "main", commitId: "b2c3d4e", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git add app.js && git commit -m \"refactor: use env variable for PORT\"",
    narration: "После коммита изменения зафиксированы. git diff снова пуст — рабочая копия совпадает с последним коммитом.",
    addCommits: [{ id: "c3d4e5f", message: "refactor: use env variable for PORT", branch: "main" }],
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что показывает git diff без дополнительных аргументов?",
    options: [
      "Разницу между двумя последними коммитами",
      "Изменения между рабочей копией и staging area (то, что ещё не добавлено через git add)",
      "Все изменения с начала проекта",
      "Разницу между локальной и удалённой веткой",
    ],
    correctIndex: 1,
    explanation:
      "git diff без аргументов показывает изменения в рабочей копии, которые ещё не добавлены в staging area (не выполнен git add). Если ты уже сделал git add, эти изменения исчезнут из вывода git diff — они теперь в staging.",
  },
  {
    question: "Как прочитать вывод diff: строка начинается с «+»?",
    options: [
      "Строка существовала раньше и была изменена",
      "Строка была удалена из файла",
      "Строка добавлена в новой версии файла",
      "Строка содержит синтаксическую ошибку",
    ],
    correctIndex: 2,
    explanation:
      "В выводе diff: строки с «+» (зелёные) — добавленные строки в новой версии; строки с «-» (красные) — удалённые строки из старой версии; строки без знака — контекст, не изменились. Это формат «unified diff», используемый повсеместно.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Мастер git diff",
  description:
    "Сделай изменения в файлах своего репозитория и попрактикуйся читать diff. Научись различать git diff (рабочая копия) и git diff --staged (staging area).",
  hint: 'Измени файл: echo "new line" >> README.md. Запусти git diff — видишь изменение. Теперь git add README.md. Запусти git diff — пусто! Запусти git diff --staged — снова видишь изменение. Сделай коммит и снова проверь git diff --staged.',
  verificationSteps: [
    "Изменил существующий файл в репозитории",
    "Запустил git diff и прочитал вывод: нашёл строки с + и -",
    "Добавил файл через git add и убедился, что git diff теперь пуст",
    "Запустил git diff --staged и увидел изменения в staging area",
    "Сделал коммит и убедился, что git diff --staged тоже стал пустым",
  ],
};

interface LevelProps {
  onComplete: (quizCorrect: number, quizTotal: number) => void;
}

export default function Level({ onComplete }: LevelProps) {
  const [currentStep, setCurrentStep] = useState<Step>("narrative");
  const [vizStep, setVizStep] = useState(0);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);

  const stepIndex = STEPS.indexOf(currentStep);

  function goToNextStep() {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }

  function handleQuizComplete(correct: number, total: number) {
    setQuizScore({ correct, total });
  }

  function handleChallengeComplete() {
    const score = quizScore ?? { correct: 0, total: quizQuestions.length };
    onComplete(score.correct, score.total);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex gap-2">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-indigo-500" : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Narrative */}
        {currentStep === "narrative" && (
          <motion.div
            key="narrative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <NarrativeBox
              text="Ты уже умеешь видеть историю через git log. Теперь научимся читать сами изменения — git diff. Это инструмент, который показывает точечно: какие строки добавились, какие удалились."
            />
            <NarrativeBox
              text="Важно понять два режима: git diff (без аргументов) показывает то, что ты изменил, но ещё не добавил в staging area (не сделал git add). После git add эти изменения «перемещаются» — теперь их покажет git diff --staged."
            />
            <NarrativeBox
              text="Формат diff кажется страшным, но на самом деле прост: строки с «+» добавлены в новой версии, строки с «-» удалены из старой. Строки без знака — контекст, они не изменились. Раздел «@@ -1,3 +1,5 @@» — это номера строк."
            />
            <NarrativeBox
              text="git diff — это не только для себя. Code review в GitHub, GitLab, Bitbucket — везде ты видишь именно этот формат diff. Умение его читать = умение делать качественные ревью чужого кода."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Покажи реальный diff!
            </button>
          </motion.div>
        )}

        {/* Step 2: Visualization */}
        {currentStep === "visualization" && (
          <motion.div
            key="visualization"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <NarrativeBox text="Смотри внимательно: после git add вывод git diff меняется. А git diff --staged показывает то, что войдёт в следующий коммит." />

            <TerminalSim lines={terminalLines} />

            <div className="h-[420px]">
              <GitVisualizer
                initial={initialCommits}
                steps={visualizerSteps}
                currentStep={vizStep}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setVizStep(Math.min(vizStep + 1, visualizerSteps.length))}
                disabled={vizStep >= visualizerSteps.length}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {vizStep === 0 ? "Показать состояния diff" : vizStep === 1 ? "git commit" : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=06-diff"
                target="_blank"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                🧪 Открыть в песочнице
              </Link>
            </div>
          </motion.div>
        )}

        {/* Step 3: Quiz */}
        {currentStep === "quiz" && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <NarrativeBox text="Проверим, как ты разобрался в git diff. Два вопроса о чтении вывода и разнице режимов." />

            <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />

            {quizScore !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <button
                  onClick={goToNextStep}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Перейти к практике
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 4: Challenge */}
        {currentStep === "challenge" && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <NarrativeBox text="Последнее задание блока basics! Стань мастером git diff — умение читать изменения пригодится тебе при каждом code review." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
