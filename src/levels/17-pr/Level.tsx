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
  { text: "# Создаём ветку для новой фичи", type: "output" as const },
  { text: "git checkout -b feature/add-search", type: "command" as const },
  { text: "Switched to a new branch 'feature/add-search'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Делаем изменения и коммитим", type: "output" as const },
  { text: "git add search.js", type: "command" as const },
  { text: "git commit -m 'feat: add search functionality'", type: "command" as const },
  { text: "[feature/add-search a1b2c3d] feat: add search functionality", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Отправляем ветку на GitHub", type: "output" as const },
  { text: "git push origin feature/add-search", type: "command" as const },
  { text: "remote: Resolving deltas: 100% (3/3), done.", type: "output" as const },
  { text: "To https://github.com/user/project.git", type: "output" as const },
  { text: " * [new branch]  feature/add-search -> feature/add-search", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Теперь на GitHub создаём Pull Request:", type: "output" as const },
  { text: "# GitHub покажет кнопку 'Compare & pull request'", type: "output" as const },
  { text: "# Заполняем заголовок и описание PR:", type: "output" as const },
  { text: "# Title: feat: add search functionality", type: "output" as const },
  { text: "# Body: Добавляет поиск по товарам.", type: "output" as const },
  { text: "#        Fixes #42", type: "output" as const },
  { text: "# Нажимаем 'Create pull request'", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add product list", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "git checkout -b feature/add-search",
    narration: "Создаём ветку feature/add-search от main. Здесь будем разрабатывать новую фичу — поиск.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "feature/add-search", commitId: "b2c3d4e", color: "#10b981" },
    ],
    moveHead: "feature/add-search",
    highlight: "b2c3d4e",
  },
  {
    command: "git commit -m 'feat: add search functionality'",
    narration: "Делаем коммит с новой функциональностью. Ветка feature/add-search ушла вперёд от main.",
    addCommits: [
      { id: "c3d4e5f", message: "feat: add search functionality", branch: "feature/add-search", parent: "b2c3d4e" },
    ],
    addBranches: [
      { name: "feature/add-search", commitId: "c3d4e5f", color: "#10b981" },
    ],
    moveHead: "feature/add-search",
    highlight: "c3d4e5f",
  },
  {
    command: "# Pull Request создан на GitHub",
    narration: "После git push создаём PR на GitHub. Коллеги проверяют код, оставляют комментарии. После одобрения — PR вливается в main. Ветка feature/add-search сливается с main.",
    addBranches: [
      { name: "main", commitId: "c3d4e5f", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что такое Pull Request (PR)?",
    options: [
      "Команда Git для скачивания изменений с сервера",
      "Запрос на слияние изменений из одной ветки в другую с возможностью code review",
      "Автоматическое слияние веток без проверки",
      "Способ удалить ветку на GitHub",
    ],
    correctIndex: 1,
    explanation:
      "Pull Request — это запрос на слияние твоих изменений в основную ветку. GitHub показывает все изменения, команда может оставить комментарии, предложить правки. Только после одобрения (approve) PR вливается в main. Это основной инструмент командной работы.",
  },
  {
    question: "Почему лучше делать PR вместо прямого push в main?",
    options: [
      "PR работает быстрее чем обычный push",
      "PR обязателен по правилам GitHub",
      "PR позволяет команде проверить код до слияния, что снижает количество ошибок в основной ветке",
      "PR автоматически исправляет ошибки в коде",
    ],
    correctIndex: 2,
    explanation:
      "Прямой push в main опасен: никто не проверил твой код, ошибки сразу попадают в продакшн. PR создаёт 'контрольную точку': другие разработчики видят изменения, могут задать вопросы, найти баги, предложить улучшения. Это стандарт в профессиональной разработке.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Создай свой первый Pull Request",
  description:
    "В любом своём репозитории на GitHub создай новую ветку, внеси изменение, запушь ветку и создай Pull Request через интерфейс GitHub.",
  hint: "Шаги: 1) git checkout -b my-feature  2) внеси изменение в файл  3) git add . && git commit -m 'feat: my change'  4) git push origin my-feature  5) На GitHub увидишь кнопку 'Compare & pull request' — нажми её!",
  verificationSteps: [
    "Создал новую ветку (git checkout -b feature/...)",
    "Внёс изменения и сделал коммит",
    "Запушил ветку (git push origin feature/...)",
    "Открыл репозиторий на GitHub и нажал 'Compare & pull request'",
    "Заполнил заголовок и описание PR",
    "Нажал 'Create pull request' — PR создан!",
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
              text="Ты научился делать push — отправлять коммиты на GitHub. Но как работать в команде, где нельзя просто так менять общий код? Здесь на помощь приходит Pull Request."
            />
            <NarrativeBox
              text="Pull Request (PR) — это запрос на слияние твоих изменений в основную ветку. Вместо прямого push в main, ты создаёшь отдельную ветку, делаешь изменения, и просишь команду проверить код перед слиянием."
            />
            <NarrativeBox
              text="Процесс такой: создать ветку → сделать изменения → push → создать PR на GitHub → дождаться review → PR сливается в main. Это называется Git Flow, и его используют почти все команды в мире."
            />
            <NarrativeBox
              text="Главное преимущество PR: код проверяют другие разработчики до того, как он попадёт в продакшн. Это снижает количество ошибок и помогает обмениваться знаниями в команде."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать PR в деле!
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
            <NarrativeBox text="Смотри: ветка уходит от main, набирает коммиты, а потом через PR сливается обратно." />

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
                  ? "Создать ветку и коммит"
                  : vizStep === 1
                  ? "Слить PR в main"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=17-pr"
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
            <NarrativeBox text="Проверим, что ты понял главное про Pull Request — зачем он нужен и как работает." />

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
            <NarrativeBox text="Время создать настоящий Pull Request на GitHub! Это один из самых важных навыков в командной разработке." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
