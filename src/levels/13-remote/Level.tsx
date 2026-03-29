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
  { text: "# Смотрим текущие удалённые репозитории", type: "output" as const },
  { text: "git remote -v", type: "command" as const },
  { text: "origin  https://github.com/myteam/project.git (fetch)", type: "output" as const },
  { text: "origin  https://github.com/myteam/project.git (push)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Добавляем дополнительный remote (upstream — оригинальный проект)", type: "output" as const },
  { text: "git remote add upstream https://github.com/original/project.git", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "git remote -v", type: "command" as const },
  { text: "origin    https://github.com/myteam/project.git (fetch)", type: "output" as const },
  { text: "origin    https://github.com/myteam/project.git (push)", type: "output" as const },
  { text: "upstream  https://github.com/original/project.git (fetch)", type: "output" as const },
  { text: "upstream  https://github.com/original/project.git (push)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Переименовываем remote", type: "output" as const },
  { text: "git remote rename origin github", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# Удаляем remote", type: "output" as const },
  { text: "git remote remove upstream", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "git remote -v", type: "command" as const },
  { text: "github  https://github.com/myteam/project.git (fetch)", type: "output" as const },
  { text: "github  https://github.com/myteam/project.git (push)", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add feature", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Локальный репозиторий после git clone",
    narration: "После git clone у тебя есть локальная ветка main и remote-tracking ветка origin/main. Обе указывают на одинаковый коммит — ты только что склонировал.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "origin/main", commitId: "b2c3d4e", color: "#f59e0b" },
    ],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git remote add upstream https://github.com/original/repo.git",
    narration: "Добавляем второй remote — 'upstream'. Это типичный паттерн при работе с форками: origin — твой форк, upstream — оригинальный проект. Так удобно синхронизироваться с источником.",
    addBranches: [
      { name: "upstream/main", commitId: "b2c3d4e", color: "#10b981" },
    ],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что такое 'origin' в Git?",
    options: [
      "Первый коммит в репозитории",
      "Название дефолтной ветки (как main или master)",
      "Стандартное имя для удалённого репозитория, откуда был клонирован проект",
      "Специальная команда для подключения к серверу",
    ],
    correctIndex: 2,
    explanation:
      "'origin' — это просто имя (псевдоним) для удалённого репозитория. Когда ты делаешь git clone, Git автоматически называет источник 'origin'. Это соглашение, а не технический термин — ты можешь назвать remote как угодно, но 'origin' — стандарт.",
  },
  {
    question: "Что показывает команда git remote -v?",
    options: [
      "Версию Git на удалённом сервере",
      "Список всех удалённых репозиториев с их URL для fetch и push",
      "Статус синхронизации с удалённым репозиторием",
      "Историю коммитов на удалённом сервере",
    ],
    correctIndex: 1,
    explanation:
      "git remote -v (verbose) показывает все настроенные remotes: имя и URL для fetch (скачивания) и push (отправки). Обычно это одинаковые URL, но теоретически они могут отличаться.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Изучи remotes своего репозитория",
  description:
    "В склонированном репозитории проверь настроенные remotes. Попробуй добавить дополнительный remote и затем удали его.",
  hint: "cd в твой склонированный репозиторий → git remote -v → git remote add test https://github.com/test/test.git → git remote -v (посмотри изменения) → git remote remove test",
  verificationSteps: [
    "Выполнил git remote -v — увидел origin",
    "Добавил новый remote командой git remote add",
    "Проверил git remote -v — теперь два remote",
    "Удалил тестовый remote командой git remote remove",
    "Убедился что остался только origin",
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
              text="Ты склонировал проект — теперь нужно понять как Git знает о существовании сервера. Знакомься: git remote — управление удалёнными репозиториями."
            />
            <NarrativeBox
              text="Remote (удалённый репозиторий) — это именованная ссылка на другой репозиторий. Когда ты клонируешь проект, Git автоматически создаёт remote с именем 'origin', указывающий на источник."
            />
            <NarrativeBox
              text="Ты можешь иметь несколько remotes! Классический паттерн при работе с open-source: 'origin' — твой форк на GitHub, 'upstream' — оригинальный репозиторий. Так легко получать обновления от авторов."
            />
            <NarrativeBox
              text="Основные команды: git remote -v (посмотреть все remotes), git remote add &lt;имя&gt; &lt;url&gt; (добавить), git remote remove &lt;имя&gt; (удалить), git remote rename &lt;старое&gt; &lt;новое&gt; (переименовать)."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать remotes в действии!
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
            <NarrativeBox text="Посмотри как работают remotes: origin — твой сервер, upstream — оригинальный проект." />

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
                {vizStep === 0 ? "git remote add upstream" : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=13-remote"
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
            <NarrativeBox text="Два вопроса про remotes — проверим что ты понял!" />

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
            <NarrativeBox text="Посмотри на remotes своего репозитория и попробуй управлять ими!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
