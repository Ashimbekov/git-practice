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
  { text: "# Клонируем публичный репозиторий по HTTPS", type: "output" as const },
  { text: "git clone https://github.com/torvalds/linux.git", type: "command" as const },
  { text: "Cloning into 'linux'...", type: "output" as const },
  { text: "remote: Enumerating objects: 10482578, done.", type: "output" as const },
  { text: "remote: Counting objects: 100% (1234/1234), done.", type: "output" as const },
  { text: "remote: Compressing objects: 100% (892/892), done.", type: "output" as const },
  { text: "Receiving objects: 100% (10482578/10482578), 3.14 GiB | 12.3 MiB/s, done.", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Клонирование в конкретную папку", type: "output" as const },
  { text: "git clone https://github.com/facebook/react.git my-react", type: "command" as const },
  { text: "Cloning into 'my-react'...", type: "output" as const },
  { text: "remote: Enumerating objects: 234567, done.", type: "output" as const },
  { text: "Resolving deltas: 100% (180234/180234), done.", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Смотрим что появилось после клонирования", type: "output" as const },
  { text: "cd my-react && ls", type: "command" as const },
  { text: "packages/  scripts/  README.md  package.json  .git/", type: "output" as const },
  { text: "git remote -v", type: "command" as const },
  { text: "origin  https://github.com/facebook/react.git (fetch)", type: "output" as const },
  { text: "origin  https://github.com/facebook/react.git (push)", type: "output" as const },
  { text: "git branch -a", type: "command" as const },
  { text: "* main", type: "success" as const },
  { text: "  remotes/origin/main", type: "output" as const },
  { text: "  remotes/origin/HEAD -> origin/main", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add components", branch: "main", parent: "a1b2c3d" },
  { id: "c3d4e5f", message: "fix: resolve bug", branch: "main", parent: "b2c3d4e" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Удалённый репозиторий на GitHub",
    narration: "На GitHub существует репозиторий с историей коммитов. Ветка main указывает на последний коммит c3d4e5f.",
    addBranches: [
      { name: "origin/main", commitId: "c3d4e5f", color: "#f59e0b" },
    ],
    moveHead: "origin/main",
    highlight: "c3d4e5f",
  },
  {
    command: "git clone https://github.com/user/repo.git",
    narration: "git clone копирует весь репозиторий на твой компьютер: все коммиты, все ветки, всю историю. Автоматически настраивается remote с именем 'origin'.",
    addBranches: [
      { name: "main", commitId: "c3d4e5f", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что происходит при выполнении git clone?",
    options: [
      "Создаётся пустой репозиторий, как при git init",
      "Копируется только последний коммит из удалённого репозитория",
      "Скачивается полная копия репозитория со всей историей и автоматически настраивается remote 'origin'",
      "Создаётся архив репозитория в формате ZIP",
    ],
    correctIndex: 2,
    explanation:
      "git clone делает полную копию: скачивает все коммиты, все ветки, всю историю. Автоматически создаёт remote с именем 'origin', указывающий на исходный репозиторий, и переключается на дефолтную ветку.",
  },
  {
    question: "Чем отличается HTTPS от SSH при клонировании?",
    options: [
      "HTTPS быстрее SSH — нужно всегда использовать HTTPS",
      "SSH работает только на Linux, HTTPS — на всех системах",
      "HTTPS требует вводить логин/пароль (или токен), SSH использует ключи — удобнее для частого использования",
      "Разницы нет — это просто разные URL с одинаковым результатом",
    ],
    correctIndex: 2,
    explanation:
      "HTTPS удобен для одноразового клонирования публичных репозиториев — не нужно настраивать ключи. SSH удобнее для постоянной работы: аутентификация через ключи, не нужно вводить пароль при каждом push/pull. Большинство разработчиков используют SSH для своих репозиториев.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Клонируй публичный репозиторий",
  description:
    "Склонируй любой публичный репозиторий с GitHub на свой компьютер. После клонирования изучи что появилось: посмотри git log, git remote -v и git branch -a.",
  hint: "Попробуй: git clone https://github.com/torvalds/linux.git (большой!) или git clone https://github.com/sindresorhus/awesome.git (маленький). После клонирования: cd awesome && git log --oneline -5 && git remote -v",
  verificationSteps: [
    "Выполнил git clone с HTTPS или SSH URL",
    "Дождался завершения клонирования",
    "Перешёл в склонированную папку (cd)",
    "Проверил git remote -v — увидел origin",
    "Посмотрел git log --oneline — увидел историю коммитов",
    "Выполнил git branch -a — увидел локальные и remote-ветки",
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
              text="Добро пожаловать в мир удалённых репозиториев! Ты получил приглашение в команду — нужно подключиться к проекту. Первый шаг: git clone."
            />
            <NarrativeBox
              text="git clone — это команда для скачивания репозитория. Она копирует всю историю, все ветки и все коммиты на твой компьютер. После клонирования ты получаешь полноценный локальный репозиторий."
            />
            <NarrativeBox
              text="Есть два способа клонировать: HTTPS (просто, не нужны ключи) и SSH (удобнее для постоянной работы, требует настройки SSH-ключей). Для публичных репозиториев — HTTPS достаточно. Для своих — рекомендуется SSH."
            />
            <NarrativeBox
              text="После git clone автоматически: создаётся папка с именем репозитория, настраивается remote 'origin' (ссылка на исходный репозиторий), и ты оказываешься на дефолтной ветке (обычно main)."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать как это работает!
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
            <NarrativeBox text="Смотри: git clone скачивает весь репозиторий и создаёт локальную копию со ссылкой на origin." />

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
                {vizStep === 0 ? "git clone" : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=12-clone"
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
            <NarrativeBox text="Проверим как ты усвоил git clone. Два вопроса — справишься!" />

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
            <NarrativeBox text="Время попробовать самому! Склонируй репозиторий и изучи его структуру." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
