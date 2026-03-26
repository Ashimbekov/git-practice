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
  { text: "mkdir my-project", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "cd my-project", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "git init", type: "command" as const },
  { text: "Initialized empty Git repository in /home/user/my-project/.git/", type: "success" as const },
  { text: "ls -la", type: "command" as const },
  { text: "drwxr-xr-x  3 user user 4096 .git", type: "output" as const },
  { text: "drwxr-xr-x  7 user user 4096 .git/objects", type: "output" as const },
  { text: "drwxr-xr-x  4 user user 4096 .git/refs", type: "output" as const },
  { text: "-rw-r--r--  1 user user   23 .git/HEAD", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "git init",
    narration: "Создаётся пустой репозиторий. Ветка main появляется, но коммитов пока нет.",
    addBranches: [{ name: "main", commitId: "", color: "#3b82f6" }],
    moveHead: "main",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что делает команда git init?",
    options: [
      "Скачивает проект из интернета",
      "Создаёт новый Git-репозиторий в текущей папке",
      "Удаляет все файлы в папке",
      "Устанавливает Git на компьютер",
    ],
    correctIndex: 1,
    explanation:
      "git init инициализирует новый Git-репозиторий — создаёт скрытую папку .git, в которой Git будет хранить всю историю изменений.",
  },
  {
    question: "Что находится в папке .git, которую создаёт git init?",
    options: [
      "Копия вашего кода для бэкапа",
      "Настройки компьютера",
      "Вся внутренняя структура Git: объекты, ссылки, конфигурация",
      "Только файл README.md",
    ],
    correctIndex: 2,
    explanation:
      "Папка .git — это сердце репозитория. В ней хранятся объекты (blobs, trees, commits), ссылки на ветки (refs), конфигурация и многое другое. Без неё Git не работает.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Создай свой первый репозиторий",
  description:
    "Открой терминал на своём компьютере и создай новый Git-репозиторий. Это будет твой первый шаг в мир контроля версий!",
  hint: "Выполни по порядку: mkdir my-first-repo && cd my-first-repo && git init. Затем проверь, что папка .git создалась: ls -la",
  verificationSteps: [
    "Создал папку для проекта (mkdir)",
    "Перешёл в неё (cd)",
    "Выполнил git init",
    "Убедился, что папка .git существует (ls -la)",
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
              text="Привет! Я Алекс, твой наставник в мире Git. Сегодня мы начнём с самого начала — создадим первый репозиторий."
            />
            <NarrativeBox
              text="Представь, что Git — это фотоальбом для твоего кода. Каждый раз, когда ты делаешь «снимок» (коммит), Git запоминает состояние всех файлов. А команда git init — это как купить новый пустой альбом."
            />
            <NarrativeBox
              text="Когда ты выполняешь git init, Git создаёт скрытую папку .git в твоём проекте. Это «мозг» репозитория — здесь хранится вся история, все ветки и настройки. Без этой папки Git ничего не знает о твоём проекте."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Понятно, дальше!
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
            <NarrativeBox text="Давай посмотрим, как это выглядит в терминале и на графе Git." />

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
                Выполнить git init
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox"
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
            <NarrativeBox text="Отлично! Теперь давай проверим, что ты запомнил. Не переживай — это не экзамен, а способ закрепить знания." />

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
            <NarrativeBox text="Теория — это здорово, но настоящие навыки появляются только с практикой. Попробуй выполнить задание на своём компьютере!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
