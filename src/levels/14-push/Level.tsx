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
  { text: "# Сделали несколько коммитов локально", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "d4e5f6g (HEAD -> main) feat: add login page", type: "output" as const },
  { text: "c3d4e5f feat: add user model", type: "output" as const },
  { text: "b2c3d4e (origin/main) feat: initial setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Отправляем коммиты на сервер", type: "output" as const },
  { text: "git push origin main", type: "command" as const },
  { text: "Enumerating objects: 7, done.", type: "output" as const },
  { text: "Counting objects: 100% (7/7), done.", type: "output" as const },
  { text: "Delta compression using up to 8 threads", type: "output" as const },
  { text: "Compressing objects: 100% (4/4), done.", type: "output" as const },
  { text: "Writing objects: 100% (5/5), 512 bytes | 512.00 KiB/s, done.", type: "output" as const },
  { text: "To https://github.com/user/project.git", type: "success" as const },
  { text: "   b2c3d4e..d4e5f6g  main -> main", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Флаг -u: устанавливаем upstream для ветки (один раз)", type: "output" as const },
  { text: "git push -u origin main", type: "command" as const },
  { text: "Branch 'main' set up to track remote branch 'main' from 'origin'.", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# После -u можно просто писать git push", type: "output" as const },
  { text: "git push", type: "command" as const },
  { text: "Everything up-to-date", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Rejected push — кто-то уже залил изменения!", type: "output" as const },
  { text: "git push origin main", type: "command" as const },
  { text: "To https://github.com/user/project.git", type: "output" as const },
  { text: " ! [rejected]        main -> main (fetch first)", type: "error" as const },
  { text: "error: failed to push some refs to 'origin'", type: "error" as const },
  { text: "hint: Updates were rejected because the remote contains work that you do", type: "output" as const },
  { text: "hint: not have locally. Integrate the remote changes (e.g.", type: "output" as const },
  { text: "hint: 'git pull ...') before pushing again.", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: initial setup", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: локальные коммиты опережают origin",
    narration: "У тебя два новых коммита, которых нет на сервере. Локальный main ушёл вперёд относительно origin/main.",
    addCommits: [
      { id: "c3d4e5f", message: "feat: add user model", branch: "main", parent: "b2c3d4e" },
      { id: "d4e5f6g", message: "feat: add login page", branch: "main", parent: "c3d4e5f" },
    ],
    addBranches: [
      { name: "main", commitId: "d4e5f6g", color: "#3b82f6" },
      { name: "origin/main", commitId: "b2c3d4e", color: "#f59e0b" },
    ],
    moveHead: "main",
    highlight: "d4e5f6g",
  },
  {
    command: "git push origin main",
    narration: "git push отправляет твои коммиты на сервер. Теперь origin/main синхронизирован с локальным main — они указывают на один и тот же коммит d4e5f6g.",
    addBranches: [
      { name: "origin/main", commitId: "d4e5f6g", color: "#f59e0b" },
    ],
    moveHead: "main",
    highlight: "d4e5f6g",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что означает флаг -u в команде git push -u origin main?",
    options: [
      "Ускоряет передачу данных (от слова 'ultra')",
      "Устанавливает upstream — связывает локальную ветку с remote-веткой, чтобы можно было просто писать git push",
      "Делает принудительный push, игнорируя конфликты",
      "Обновляет только изменённые файлы, а не все коммиты",
    ],
    correctIndex: 1,
    explanation:
      "Флаг -u (--set-upstream) устанавливает связь между локальной веткой и remote-веткой. После git push -u origin main можно просто писать git push или git pull — Git знает куда отправлять и откуда получать изменения.",
  },
  {
    question: "Почему git push может выдать ошибку 'rejected'?",
    options: [
      "Нет интернет-соединения",
      "Файлы слишком большие",
      "На сервере есть коммиты, которых нет у тебя локально — нужно сначала сделать git pull",
      "Истёк срок действия репозитория",
    ],
    correctIndex: 2,
    explanation:
      "Git защищает тебя от потери чужих коммитов. Если на сервере есть изменения, которых нет у тебя (например, коллега залил свои коммиты), Git отклоняет твой push. Решение: сначала git pull (получи чужие изменения и объедини), затем git push.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Отправь коммит в удалённый репозиторий",
  description:
    "Создай новый репозиторий на GitHub (или используй существующий), сделай локальный коммит и отправь его на сервер командой git push.",
  hint: "Создай репо на github.com → git clone <url> → cd <папка> → создай файл → git add . → git commit -m 'feat: first push' → git push origin main (или git push -u origin main если первый раз)",
  verificationSteps: [
    "Создал или выбрал репозиторий на GitHub",
    "Клонировал его локально",
    "Создал новый файл или изменил существующий",
    "Сделал git add и git commit",
    "Выполнил git push origin main",
    "Проверил на GitHub — коммит появился в репозитории",
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
              text="Фича готова! Теперь нужно поделиться с командой — отправить коммиты на сервер. Для этого существует git push."
            />
            <NarrativeBox
              text="git push origin main — отправляет коммиты из локальной ветки main в ветку main удалённого репозитория origin. Формат: git push &lt;remote&gt; &lt;ветка&gt;."
            />
            <NarrativeBox
              text="Флаг -u (--set-upstream) устанавливает связь между локальной и remote-веткой. После git push -u origin main можно просто писать git push — Git будет знать куда отправлять."
            />
            <NarrativeBox
              text="Важно: если кто-то из команды залил изменения пока ты работал, push будет отклонён. Git защищает от перезаписи чужих коммитов. Решение: сначала git pull, затем git push."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать git push в деле!
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
            <NarrativeBox text="Смотри: локальные коммиты отправляются на сервер, и origin/main догоняет локальный main." />

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
                {vizStep === 0 ? "git push origin main" : "Готово"}
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
            <NarrativeBox text="Два вопроса про git push — проверим понимание!" />

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
            <NarrativeBox text="Сделай реальный push в свой репозиторий на GitHub!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
