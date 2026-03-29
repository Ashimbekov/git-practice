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
  { text: "# Смотрим текущие ветки", type: "command" as const },
  { text: "git branch", type: "command" as const },
  { text: "* main", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Создаём новую ветку для задачи", type: "output" as const },
  { text: "git branch feature/login", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# Снова смотрим список веток", type: "output" as const },
  { text: "git branch", type: "command" as const },
  { text: "  feature/login", type: "output" as const },
  { text: "* main", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Звёздочка (*) означает текущую ветку — мы всё ещё на main!", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Удаляем ветку (если она больше не нужна)", type: "output" as const },
  { text: "git branch -d feature/login", type: "command" as const },
  { text: "Deleted branch feature/login (was a1b2c3d).", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial project setup", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add user model", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: main с двумя коммитами",
    narration: "У нас есть ветка main с двумя коммитами. HEAD указывает на main — мы работаем на этой ветке.",
    addBranches: [{ name: "main", commitId: "b2c3d4e", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git branch feature/login",
    narration: "Создаём ветку feature/login. Важно: ветка создана, но мы ОСТАЛИСЬ на main. git branch только создаёт указатель — новый ярлык на тот же коммит b2c3d4e.",
    addBranches: [{ name: "feature/login", commitId: "b2c3d4e", color: "#10b981" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git branch -d feature/login",
    narration: "Удаляем ветку. Коммиты никуда не исчезают — удаляется только указатель (ярлык). Флаг -d безопасен: он не даст удалить ветку с неслитыми изменениями.",
    removeBranches: ["feature/login"],
    moveHead: "main",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что делает команда git branch feature/login?",
    options: [
      "Создаёт новую ветку И сразу переключается на неё",
      "Создаёт новую ветку, но остаётся на текущей ветке",
      "Переименовывает текущую ветку в feature/login",
      "Скачивает ветку feature/login с сервера",
    ],
    correctIndex: 1,
    explanation:
      "git branch <name> только создаёт новый указатель (ярлык) на текущий коммит. Переключение НЕ происходит — HEAD по-прежнему указывает на прежнюю ветку. Чтобы сразу переключиться, нужна команда git switch -c или git checkout -b.",
  },
  {
    question: "Ты создал ветку git branch fix/bug, поработал на ней и решил удалить. Какой флаг безопаснее использовать?",
    options: [
      "-D (принудительное удаление, даже если есть неслитые коммиты)",
      "-d (удаление только если все изменения уже слиты)",
      "--remove (стандартный флаг удаления)",
      "--delete-force (полное удаление с историей)",
    ],
    correctIndex: 1,
    explanation:
      "git branch -d удаляет ветку только если все её коммиты уже влиты (merged) в текущую ветку. Это защита от случайной потери работы. Если ты уверен, что хочешь удалить ветку с неслитыми коммитами — используй -D, но осознанно.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Создай рабочую ветку",
  description:
    "Тимлид дал первую задачу — добавить страницу профиля пользователя. Создай для неё отдельную ветку, проверь что она появилась в списке, и убедись что ты всё ещё на main.",
  hint: "Выполни: git branch feature/user-profile. Затем git branch — увидишь список веток, звёздочка у main. Для удаления (когда не нужна): git branch -d feature/user-profile",
  verificationSteps: [
    "Перешёл в существующий git репозиторий",
    "Выполнил git branch feature/user-profile (или любое другое имя)",
    "Запустил git branch и увидел новую ветку в списке",
    "Убедился, что звёздочка (*) стоит у main — ты не переключился",
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
              text="Тимлид дал первую настоящую задачу: добавить авторизацию. Но работать прямо на main — плохая идея. Что если сломаешь что-то? Поэтому разработчики всегда работают в отдельных ветках."
            />
            <NarrativeBox
              text="Ветка в Git — это просто лёгкий указатель (ярлык) на определённый коммит. Представь стикер с названием, приклеенный к коммиту. Когда ты делаешь новый коммит на ветке, стикер автоматически перемещается вперёд."
            />
            <NarrativeBox
              text="Команда git branch делает три вещи: без аргументов — показывает все ветки (звёздочка = текущая), с именем — создаёт новую ветку, с флагом -d — удаляет ветку. Создание ветки НЕ переключает на неё — это важно запомнить!"
            />
            <NarrativeBox
              text="Правила именования веток: используй / для группировки (feature/login, fix/typo, release/v2.0), избегай пробелов и спецсимволов. Популярные префиксы: feature/, fix/, hotfix/, release/, chore/."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать в действии!
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
            <NarrativeBox text="Смотри: git branch создаёт новый ярлык на тот же коммит. HEAD остаётся на main. Обе ветки указывают на одно место — расходиться они начнут только когда ты сделаешь коммиты на одной из них." />

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
                {vizStep === 0 ? "git branch feature/login" : vizStep === 1 ? "git branch -d feature/login" : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=07-branch"
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
            <NarrativeBox text="Проверим ключевые моменты про ветки. Два вопроса — один частый источник ошибок у новичков!" />

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
            <NarrativeBox text="Время попрактиковаться! Создай ветку на своём компьютере и убедись, что понимаешь: создание ветки ≠ переключение на неё." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
