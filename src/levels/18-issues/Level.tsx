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
  { text: "# Issues создаются на GitHub (веб-интерфейс)", type: "output" as const },
  { text: "# Ты создал issue #5: 'Кнопка поиска не работает'", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Локально создаём ветку для исправления", type: "output" as const },
  { text: "git checkout -b fix/search-button", type: "command" as const },
  { text: "Switched to a new branch 'fix/search-button'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Исправляем баг в search.js", type: "output" as const },
  { text: "git add search.js", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# Магия: 'Fixes #5' в коммите автоматически закроет issue!", type: "output" as const },
  { text: "git commit -m 'fix: repair search button click handler'", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# При мёрже PR в main GitHub закроет issue #5 автоматически", type: "output" as const },
  { text: "[fix/search-button d4e5f6g] fix: repair search button click handler", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "git push origin fix/search-button", type: "command" as const },
  { text: "To https://github.com/user/project.git", type: "output" as const },
  { text: " * [new branch]  fix/search-button -> fix/search-button", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Создаём PR с описанием 'Fixes #5'", type: "output" as const },
  { text: "# После мёржа PR — issue #5 закроется автоматически!", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add search", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Issue #5 открыт: 'Кнопка поиска не работает'",
    narration: "На GitHub создан Issue #5 с описанием бага. Ему назначены метка 'bug' и исполнитель. Теперь баг отслеживается.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git checkout -b fix/search-button",
    narration: "Создаём ветку специально для исправления этого бага. Хорошая практика — называть ветку по номеру issue.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "fix/search-button", commitId: "b2c3d4e", color: "#ef4444" },
    ],
    moveHead: "fix/search-button",
    highlight: "b2c3d4e",
  },
  {
    command: "git commit -m 'fix: repair search button (Fixes #5)'",
    narration: "Коммит с 'Fixes #5' — GitHub свяжет этот коммит с issue. Когда PR сольётся в main, issue #5 закроется автоматически!",
    addCommits: [
      { id: "c3d4e5f", message: "fix: repair search button (Fixes #5)", branch: "fix/search-button", parent: "b2c3d4e" },
    ],
    addBranches: [
      { name: "fix/search-button", commitId: "c3d4e5f", color: "#ef4444" },
      { name: "main", commitId: "c3d4e5f", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что произойдёт, если написать 'Fixes #42' в описании Pull Request?",
    options: [
      "Ничего особенного — это просто текст",
      "GitHub автоматически закроет Issue #42, когда PR будет смёржен в основную ветку",
      "GitHub удалит Issue #42 сразу при создании PR",
      "Issue #42 будет заморожен до закрытия PR",
    ],
    correctIndex: 1,
    explanation:
      "GitHub понимает ключевые слова: Fixes, Closes, Resolves перед номером issue (например, Fixes #42). Когда PR с таким описанием сливается в main, GitHub автоматически закрывает связанный issue. Это удобно — не нужно закрывать вручную, и история коммитов связана с задачами.",
  },
  {
    question: "Зачем использовать Labels (метки) в GitHub Issues?",
    options: [
      "Метки обязательны — без них issue нельзя создать",
      "Метки нужны только для красоты и цветового оформления",
      "Метки помогают классифицировать задачи (bug, feature, docs) и фильтровать их в списке",
      "Метки определяют приоритет выполнения — задачи с метками выполняются быстрее",
    ],
    correctIndex: 2,
    explanation:
      "Labels — это теги для классификации issues. Например: 'bug' для ошибок, 'enhancement' для улучшений, 'documentation' для документации. Они помогают быстро фильтровать задачи: 'покажи все баги' или 'что осталось для релиза'. В больших проектах без меток сложно ориентироваться в сотнях issues.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Создай Issue и свяжи его с коммитом",
  description:
    "На GitHub создай новый Issue в своём репозитории. Затем сделай коммит, который ссылается на этот issue, и создай PR с описанием 'Fixes #N'.",
  hint: "1) На GitHub: вкладка Issues → New Issue → заполни название и описание  2) Запомни номер issue (например, #1)  3) Создай ветку: git checkout -b fix/issue-1  4) Внеси изменение и закоммить  5) Push и создай PR с 'Fixes #1' в описании",
  verificationSteps: [
    "Создал Issue на GitHub с описанием задачи или бага",
    "Создал новую ветку для исправления",
    "Сделал коммит с изменением",
    "Запушил ветку на GitHub",
    "Создал PR с 'Fixes #N' в заголовке или описании",
    "Убедился, что GitHub показывает связь между PR и Issue",
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
              text="Как команда отслеживает задачи и баги? GitHub Issues — это встроенный трекер задач прямо в репозитории. Здесь хранятся баги, идеи для фич, технический долг."
            />
            <NarrativeBox
              text="Каждый Issue имеет: заголовок, описание, метки (Labels), исполнителя (Assignee) и статус (открыт/закрыт). Можно добавлять скриншоты, код, ссылки на другие issues."
            />
            <NarrativeBox
              text="Самая мощная фича — связывание Issues с коммитами и PR. Напишешь 'Fixes #5' в описании PR — и когда он сольётся в main, issue #5 автоматически закроется. Git-история становится документацией!"
            />
            <NarrativeBox
              text="Профессиональный workflow: 1) Создаём Issue с описанием задачи  2) Назначаем исполнителя и метку  3) Создаём ветку для работы  4) В PR пишем 'Closes #N'  5) После мёржа issue закрывается сам."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Посмотреть как это работает!
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
            <NarrativeBox text="Смотри как Issue связывается с веткой и коммитом, а потом закрывается автоматически при мёрже." />

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
                  ? "Создать ветку для фикса"
                  : vizStep === 1
                  ? "Закоммитить и слить PR"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=18-issues"
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
            <NarrativeBox text="Проверим знания о GitHub Issues и как они связываются с кодом." />

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
            <NarrativeBox text="Попробуй полный цикл: Issue → ветка → коммит → PR → автозакрытие issue. Это стандартный рабочий процесс в командах!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
