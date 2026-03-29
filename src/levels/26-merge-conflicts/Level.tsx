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
  { text: "# Оба разработчика изменили один файл в разных ветках", type: "output" as const },
  { text: "git switch main", type: "command" as const },
  { text: "Switched to branch 'main'", type: "success" as const },
  { text: "git merge feature/about-page", type: "command" as const },
  { text: "Auto-merging README.md", type: "output" as const },
  { text: "CONFLICT (content): Merge conflict in README.md", type: "error" as const },
  { text: "Automatic merge failed; fix conflicts and then commit the result.", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "# Смотрим конфликтный файл", type: "output" as const },
  { text: "cat README.md", type: "command" as const },
  { text: "# My Project", type: "output" as const },
  { text: "<<<<<<< HEAD", type: "error" as const },
  { text: "Описание от команды main.", type: "output" as const },
  { text: "=======", type: "output" as const },
  { text: "Описание от команды feature/about-page.", type: "output" as const },
  { text: ">>>>>>> feature/about-page", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "# Редактируем файл вручную — оставляем нужное содержимое", type: "output" as const },
  { text: "# После редактирования:", type: "output" as const },
  { text: "# My Project", type: "output" as const },
  { text: "# Описание от команды main и feature/about-page вместе.", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "git add README.md", type: "command" as const },
  { text: "git commit -m \"merge: resolve conflict in README.md\"", type: "command" as const },
  { text: "[main f1a2b3c] merge: resolve conflict in README.md", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial setup", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "docs: add README", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: две ветки от одного коммита",
    narration: "Обе ветки — main и feature/about-page — стартовали с b2c3d4e. Каждая пошла своим путём.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "feature/about-page", commitId: "b2c3d4e", color: "#10b981" },
    ],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git commit (main: 'docs: update README для main')",
    narration: "Разработчик на main изменил README.md — добавил описание со своей стороны.",
    addCommits: [
      { id: "c3d4e5f", message: "docs: update README для main", branch: "main", parent: "b2c3d4e" },
    ],
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
  {
    command: "git commit (feature/about-page: 'docs: update README для about')",
    narration: "Другой разработчик на feature/about-page тоже изменил тот же README.md. Теперь один файл изменён в двух ветках по-разному — конфликт неизбежен.",
    addCommits: [
      { id: "d3e4f5g", message: "docs: update README для about", branch: "feature/about-page", parent: "b2c3d4e" },
    ],
    addBranches: [{ name: "feature/about-page", commitId: "d3e4f5g", color: "#10b981" }],
    moveHead: "feature/about-page",
    highlight: "d3e4f5g",
  },
  {
    command: "git merge feature/about-page → CONFLICT!",
    narration: "Git пытается слить ветки, но обнаруживает, что README.md изменён в обоих направлениях. Автоматическое слияние невозможно — Git останавливается и ждёт, пока разработчик разрешит конфликт вручную.",
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#ef4444" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
  {
    command: "# Разрешаем конфликт → git add → git commit",
    narration: "После ручного редактирования файла: убираем маркеры <<<<<<<, =======, >>>>>>>, оставляем нужный результат. Затем git add сигнализирует Git что конфликт решён, и git commit завершает слияние.",
    addCommits: [
      {
        id: "f1a2b3c",
        message: "merge: resolve conflict in README.md",
        branch: "main",
        parent: "c3d4e5f",
        secondParent: "d3e4f5g",
      },
    ],
    addBranches: [{ name: "main", commitId: "f1a2b3c", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "f1a2b3c",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что означает маркер <<<<<<< HEAD в конфликтном файле?",
    options: [
      "Начало файла, который нужно удалить",
      "Начало изменений из текущей ветки (той, в которую вливаем)",
      "Начало изменений из входящей ветки",
      "Ошибка Git — файл повреждён",
    ],
    correctIndex: 1,
    explanation:
      "<<<<<<< HEAD обозначает начало блока с изменениями из текущей ветки (HEAD — это твоя активная ветка). Всё между <<<<<<< HEAD и ======= — это версия из твоей ветки.",
  },
  {
    question: "Что нужно сделать ПОСЛЕ того, как вручную отредактировал конфликтный файл?",
    options: [
      "Просто сохранить файл — Git сам поймёт",
      "Выполнить git merge --continue",
      "Выполнить git add <файл>, а затем git commit",
      "Удалить папку .git и начать заново",
    ],
    correctIndex: 2,
    explanation:
      "После разрешения конфликта нужно явно сказать Git, что файл готов: git add <файл> помечает конфликт как решённый, а git commit завершает операцию слияния и создаёт merge commit.",
  },
  {
    question: "Почему возникают конфликты при слиянии?",
    options: [
      "Из-за ошибок в коде одного из разработчиков",
      "Когда один и тот же фрагмент файла изменён в обеих сливаемых ветках по-разному",
      "Всегда при слиянии более двух веток",
      "Когда ветки созданы с одинаковыми именами",
    ],
    correctIndex: 1,
    explanation:
      "Конфликт возникает, когда Git не может автоматически решить, какую версию взять: один и тот же участок кода изменён в обеих ветках по-разному. Git умеет автоматически объединять изменения в разных частях файла, но не в одном месте.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Создай и разреши конфликт",
  description:
    "Создай ситуацию конфликта: две ветки, изменяющие одну строку одного файла. Затем слей их и разреши конфликт вручную, убрав маркеры.",
  hint: "1) git init && echo 'line1' > file.txt && git add . && git commit -m 'init'. 2) git switch -c branch-a → измени file.txt → коммит. 3) git switch main → измени ту же строку → коммит. 4) git merge branch-a → увидишь CONFLICT. 5) Открой file.txt, убери маркеры, оставь нужный текст. 6) git add file.txt && git commit.",
  verificationSteps: [
    "Создал репозиторий с файлом и начальным коммитом",
    "Создал ветку branch-a, изменил строку в файле, сделал коммит",
    "Вернулся на main, изменил ту же строку, сделал коммит",
    "Выполнил git merge branch-a — увидел сообщение CONFLICT",
    "Открыл файл, нашёл маркеры <<<<<<< / ======= / >>>>>>>",
    "Отредактировал файл вручную, убрал маркеры",
    "Выполнил git add и git commit для завершения слияния",
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
              text="Релиз на носу — вся команда работает параллельно. Ты и твой коллега изменили один и тот же файл в разных ветках. Пришло время слить — и Git выдаёт: CONFLICT. Что делать?"
            />
            <NarrativeBox
              text="Конфликт — это не ошибка, это нормальная часть командной работы. Он возникает, когда Git не может автоматически решить, какую версию кода взять: оба разработчика изменили один и тот же фрагмент по-разному."
            />
            <NarrativeBox
              text="Git помечает конфликтный файл специальными маркерами. Между <<<<<<< HEAD и ======= — твои изменения (текущая ветка). Между ======= и >>>>>>> branch-name — изменения из входящей ветки. Твоя задача: убрать маркеры и оставить правильный результат."
            />
            <NarrativeBox
              text="Алгоритм разрешения: 1) Открой конфликтный файл. 2) Найди маркеры. 3) Решите с командой, что оставить — одну версию, другую или объединить обе. 4) Удали все маркеры (<<<<<<<, =======, >>>>>>>). 5) git add файл. 6) git commit."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать конфликт в деле!
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
            <NarrativeBox text="Смотри: два разработчика изменили один файл — Git останавливается и просит помощи. Пройдём весь путь от конфликта до успешного слияния." />

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
                {vizStep === 0
                  ? "Коммит на main"
                  : vizStep === 1
                  ? "Коммит на feature/about-page"
                  : vizStep === 2
                  ? "git merge → CONFLICT"
                  : vizStep === 3
                  ? "Разрешаем конфликт"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=26-merge-conflicts"
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
            <NarrativeBox text="Три вопроса про конфликты. Умение читать маркеры и знать порядок действий — навык, который спасёт тебя в любой команде." />

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
            <NarrativeBox text="Время намеренно создать конфликт и победить его! Это лучший способ перестать бояться надписи CONFLICT." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
