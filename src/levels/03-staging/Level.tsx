"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NarrativeBox } from "@/components/narrative";
import { TerminalSim } from "@/components/terminal-sim";
import { GitVisualizer } from "@/components/git-visualizer";
import { Quiz } from "@/components/quiz";
import { Challenge } from "@/components/challenge";
import { SandboxChallenge, ValidationResult } from "@/components/sandbox";
import { EngineState } from "@/engine/git-sandbox/types";
import {
  QuizQuestion,
  ChallengeTask,
  GitCommitNode,
  GitVisualizerStep,
} from "@/types";

type Step = "narrative" | "visualization" | "quiz" | "challenge";

const STEPS: Step[] = ["narrative", "visualization", "quiz", "challenge"];

const terminalLines = [
  { text: "# У нас есть три файла с изменениями", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch main", type: "output" as const },
  { text: "Changes not staged for commit:", type: "output" as const },
  { text: "        modified:   app.js", type: "error" as const },
  { text: "        modified:   style.css", type: "error" as const },
  { text: "Untracked files:", type: "output" as const },
  { text: "        notes.txt", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "# Добавляем только app.js (частичное добавление)", type: "output" as const },
  { text: "git add app.js", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "Changes to be committed:", type: "success" as const },
  { text: "        modified:   app.js", type: "success" as const },
  { text: "Changes not staged for commit:", type: "output" as const },
  { text: "        modified:   style.css", type: "error" as const },
  { text: "Untracked files:", type: "output" as const },
  { text: "        notes.txt", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "# Добавляем все файлы сразу", type: "output" as const },
  { text: "git add .", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "Changes to be committed:", type: "success" as const },
  { text: "        modified:   app.js", type: "success" as const },
  { text: "        modified:   style.css", type: "success" as const },
  { text: "        new file:   notes.txt", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "Initial commit", branch: "main" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "git add app.js",
    narration: "app.js попал в staging area. style.css и notes.txt пока не добавлены — Git их видит, но не включит в коммит.",
    addBranches: [{ name: "main", commitId: "a1b2c3d", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "a1b2c3d",
  },
  {
    command: "git add .",
    narration: "git add . добавил все оставшиеся файлы в staging area. Теперь все три файла готовы к коммиту.",
    addCommits: [{ id: "b2c3d4e", message: "feat: update app and styles", branch: "main" }],
    addBranches: [{ name: "main", commitId: "b2c3d4e", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что делает команда git add .?",
    options: [
      "Добавляет только файл с именем \".\" в staging area",
      "Добавляет все изменённые и новые файлы из текущей папки в staging area",
      "Создаёт новый коммит со всеми файлами",
      "Удаляет все файлы из staging area",
    ],
    correctIndex: 1,
    explanation:
      "git add . добавляет в staging area все изменённые, новые и удалённые файлы из текущей директории рекурсивно. Это удобно, когда хочешь зафиксировать все изменения сразу, но используй осторожно — можно случайно добавить лишнее.",
  },
  {
    question: "В чём преимущество частичного добавления (git add конкретного файла)?",
    options: [
      "Оно работает быстрее, чем git add .",
      "Позволяет создавать атомарные коммиты — каждый коммит содержит только логически связанные изменения",
      "Позволяет добавлять файлы без прав доступа",
      "Автоматически проверяет синтаксис кода",
    ],
    correctIndex: 1,
    explanation:
      "Частичное добавление позволяет создавать атомарные коммиты — когда каждый коммит содержит одно логическое изменение. Например, исправление бага отдельно от добавления новой функции. Это делает историю чистой и понятной.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Практика staging area",
  description:
    "Создай несколько файлов с разными изменениями и потренируйся добавлять их в staging area по отдельности. Убедись, что понимаешь разницу между git add <файл> и git add .",
  hint: 'Создай файлы: echo "feature" > feature.js && echo "bugfix" > fix.js. Добавь только feature.js: git add feature.js. Проверь: git status. Теперь добавь всё остальное: git add . Сделай коммит: git commit -m "add feature and fix"',
  verificationSteps: [
    "Создал два или более файла в репозитории",
    "Добавил только один файл с помощью git add <файл>",
    "Проверил git status — увидел один файл в staging, остальные — нет",
    "Добавил оставшиеся файлы через git add .",
    "Сделал коммит и убедился, что все файлы попали в него",
  ],
};

interface LevelProps {
  onComplete: (quizCorrect: number, quizTotal: number) => void;
  preset?: () => EngineState;
  validator?: (state: EngineState) => ValidationResult;
}

export default function Level({ onComplete, preset, validator }: LevelProps) {
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
              text="Отлично, ты уже умеешь делать коммиты! Но в реальной жизни ты часто меняешь сразу много файлов — и не всегда хочешь зафиксировать все изменения в одном коммите."
            />
            <NarrativeBox
              text="Представь: ты исправил баг в app.js и параллельно начал новую фичу в feature.js. Это два разных изменения — они должны быть в двух разных коммитах. Именно для этого staging area даёт тебе полный контроль."
            />
            <NarrativeBox
              text="У тебя есть три инструмента: git add <файл> — добавить конкретный файл; git add . — добавить все изменения в текущей папке; git add -p — интерактивно выбрать даже части файла. Начнём с первых двух!"
            />
            <NarrativeBox
              text="Золотое правило: каждый коммит должен содержать одно логическое изменение. «Исправил баг #42» — хороший коммит. «Исправил баг, добавил фичу, поправил стили, обновил README» — плохой коммит."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Понятно, покажи в действии!
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
            <NarrativeBox text="Смотри, как staging area позволяет выбрать только нужные файлы для коммита. У нас три изменённых файла, но мы добавляем их по-разному." />

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
                {vizStep === 0 ? "git add app.js" : vizStep === 1 ? "git add ." : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=03-staging"
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
            <NarrativeBox text="Проверим знания о staging area. Два вопроса — вперёд!" />

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
            <NarrativeBox text="Пора попрактиковаться! Научись выбирать файлы для staging area — это навык, который ты будешь использовать ежедневно." />

            {validator ? (
              <SandboxChallenge
                description={challengeTask.description}
                hint={challengeTask.hint}
                preset={preset}
                validate={validator}
                onComplete={handleChallengeComplete}
              />
            ) : (
              <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
