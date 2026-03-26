"use client";

import { useState } from "react";
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
  { text: "# Ты в середине работы над фичей, вдруг нужно срочно переключиться", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch feature/payment", type: "output" as const },
  { text: "Changes not staged for commit:", type: "output" as const },
  { text: "  modified:   payment.js", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Прячем изменения в stash", type: "output" as const },
  { text: 'git stash push -m "WIP: payment form validation"', type: "command" as const },
  { text: "Saved working directory and index state On feature/payment: WIP: payment form validation", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Теперь рабочая директория чистая — можно переключаться", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "nothing to commit, working tree clean", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "git switch main", type: "command" as const },
  { text: "Switched to branch 'main'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# ... делаем срочную работу на main ...", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Возвращаемся и смотрим список stash-ей", type: "output" as const },
  { text: "git switch feature/payment", type: "command" as const },
  { text: "git stash list", type: "command" as const },
  { text: "stash@{0}: On feature/payment: WIP: payment form validation", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Восстанавливаем изменения и удаляем из stash", type: "output" as const },
  { text: "git stash pop", type: "command" as const },
  { text: "On branch feature/payment", type: "output" as const },
  { text: "Changes not staged for commit:", type: "output" as const },
  { text: "  modified:   payment.js", type: "output" as const },
  { text: "Dropped stash@{0}", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial setup", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add cart", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: есть незафиксированные изменения",
    narration: "Ты работаешь на feature/payment. В рабочей директории есть изменения, которые ты ещё не закоммитил. Переключиться на main нельзя — Git защищает незафиксированные изменения.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "feature/payment", commitId: "b2c3d4e", color: "#10b981" },
    ],
    moveHead: "feature/payment",
    highlight: "b2c3d4e",
  },
  {
    command: 'git stash push -m "WIP: payment form"',
    narration: "git stash сохраняет твои незафиксированные изменения в специальное хранилище — стек stash-ей. Рабочая директория становится чистой. Теперь можно безопасно переключить ветку.",
    addBranches: [{ name: "feature/payment", commitId: "b2c3d4e", color: "#10b981" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git stash pop",
    narration: "git stash pop извлекает последний stash и применяет изменения обратно в рабочую директорию. Stash удаляется из стека. Ты снова там, где остановился!",
    addBranches: [{ name: "feature/payment", commitId: "b2c3d4e", color: "#10b981" }],
    moveHead: "feature/payment",
    highlight: "b2c3d4e",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "В чём разница между git stash pop и git stash apply?",
    options: [
      "Нет разницы — это синонимы",
      "pop применяет stash и удаляет его из стека; apply применяет, но оставляет в стеке",
      "apply применяет stash и удаляет его; pop только показывает содержимое",
      "pop работает только с последним stash, apply — с любым",
    ],
    correctIndex: 1,
    explanation:
      "git stash pop = apply + drop: применяет изменения И удаляет запись из стека. git stash apply только применяет, запись остаётся. Используй apply, если хочешь применить тот же stash несколько раз или на разных ветках.",
  },
  {
    question: "Ты сделал несколько git stash. Как посмотреть все сохранённые stash-и?",
    options: [
      "git stash show",
      "git stash list",
      "git stash status",
      "git stash all",
    ],
    correctIndex: 1,
    explanation:
      "git stash list показывает все сохранённые stash-и в виде стека: stash@{0} — самый свежий, stash@{1} — предыдущий и т.д. Чтобы применить конкретный: git stash pop stash@{1}.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Спрячь и восстанови изменения",
  description:
    "Создай файл с изменениями, спрячь их через git stash, переключись на другую ветку, вернись и восстанови изменения.",
  hint: "1) Измени любой файл. 2) git stash push -m 'мои изменения'. 3) git switch main (или другую ветку). 4) git switch -. 5) git stash pop. Проверь git stash list до и после pop.",
  verificationSteps: [
    "Создал или изменил файл в рабочей директории",
    "Выполнил git stash push (с описанием или без)",
    "Убедился, что git status показывает 'nothing to commit'",
    "Переключился на другую ветку (git switch main)",
    "Вернулся на исходную ветку и выполнил git stash pop",
    "Убедился, что изменения вернулись (git status показывает modified)",
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
              text="Середина рабочего дня. Ты в разгаре написания кода — payment.js наполовину переписан, тесты красные. И вдруг приходит сообщение: 'Срочно! Прод упал, нужен хотфикс на main!'"
            />
            <NarrativeBox
              text="Коммитить незаконченный код нельзя — он сломает ветку. Откатывать изменения жаль — полчаса работы. Выход: git stash. Эта команда прячет твои незафиксированные изменения в специальное хранилище."
            />
            <NarrativeBox
              text="git stash — это как положить работу в ящик стола: она никуда не денется, но стол свободен. После хотфикса достаёшь обратно через git stash pop и продолжаешь с того места, где остановился."
            />
            <NarrativeBox
              text="Stash хранит стек изменений. Можно сделать несколько stash-ей, посмотреть их список (git stash list), применить конкретный (git stash apply stash@{1}) или удалить (git stash drop)."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать stash в действии!
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
            <NarrativeBox text="Смотри на типичный stash-workflow: прячем изменения → переключаемся → работаем → возвращаем." />

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
                  ? "git stash push"
                  : vizStep === 1
                  ? "git stash pop"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
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
            <NarrativeBox text="Два вопроса про stash. Убедись, что понимаешь разницу между pop и apply — это частая ошибка." />

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
            <NarrativeBox text="Попрактикуй полный цикл: спрячь изменения, переключись на другую ветку, вернись и восстанови. Это базовый навык для любого профессионального разработчика!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
