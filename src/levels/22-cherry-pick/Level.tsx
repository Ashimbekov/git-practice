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
  { text: "# Ситуация: нужен конкретный коммит из feature-ветки, не вся ветка", type: "output" as const },
  { text: "git log --oneline feature/payments", type: "command" as const },
  { text: "f7e6d5c fix: critical security patch in checkout", type: "output" as const },
  { text: "e6d5c4b feat: add PayPal integration", type: "output" as const },
  { text: "d5c4b3a feat: add Stripe checkout form", type: "output" as const },
  { text: "a1b2c3d feat: initial payments module", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Нам нужен только хотфикс f7e6d5c — переносим его в main", type: "output" as const },
  { text: "git switch main", type: "command" as const },
  { text: "Switched to branch 'main'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "git cherry-pick f7e6d5c", type: "command" as const },
  { text: "[main g8f7e6d] fix: critical security patch in checkout", type: "success" as const },
  { text: " 1 file changed, 3 insertions(+), 1 deletion(-)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "git log --oneline main", type: "command" as const },
  { text: "g8f7e6d (HEAD -> main) fix: critical security patch in checkout", type: "output" as const },
  { text: "b2c3d4e feat: add user profile", type: "output" as const },
  { text: "a1b2c3d feat: initial payments module", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Тот же патч, новый хеш — это копия коммита!", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial setup", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add user profile", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние",
    narration: "В feature/payments есть несколько коммитов. Один из них — критический патч безопасности. Нам нужен именно он в main, без всего остального.",
    addCommits: [
      { id: "d5c4b3a", message: "feat: Stripe checkout", branch: "feature/payments", parent: "a1b2c3d" },
      { id: "e6d5c4b", message: "feat: PayPal integration", branch: "feature/payments", parent: "d5c4b3a" },
      { id: "f7e6d5c", message: "fix: critical security patch", branch: "feature/payments", parent: "e6d5c4b" },
    ],
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "feature/payments", commitId: "f7e6d5c", color: "#10b981" },
    ],
    moveHead: "main",
    highlight: "f7e6d5c",
  },
  {
    command: "git cherry-pick f7e6d5c",
    narration: "cherry-pick копирует изменения из коммита f7e6d5c и создаёт НОВЫЙ коммит g8f7e6d на main. Содержимое патча то же самое, но хеш другой — у нового коммита другой родитель (b2c3d4e, а не e6d5c4b). Оригинальный коммит в feature/payments остаётся нетронутым.",
    addCommits: [
      { id: "g8f7e6d", message: "fix: critical security patch", branch: "main", parent: "b2c3d4e" },
    ],
    addBranches: [{ name: "main", commitId: "g8f7e6d", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "g8f7e6d",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что происходит с хешем коммита при cherry-pick?",
    options: [
      "Хеш остаётся таким же — это тот же коммит",
      "Создаётся новый коммит с новым хешем (другой родитель, другое время)",
      "Хеш изменяется только если был конфликт",
      "Git переносит коммит целиком, удаляя его из исходной ветки",
    ],
    correctIndex: 1,
    explanation:
      "cherry-pick создаёт НОВЫЙ коммит. Содержимое изменений (diff) копируется, но у нового коммита другой родитель и другое время создания — а значит другой хеш. Оригинальный коммит в исходной ветке остаётся нетронутым.",
  },
  {
    question: "Когда cherry-pick — правильный выбор?",
    options: [
      "Когда нужно объединить все изменения двух веток",
      "Когда нужно перенести один конкретный багфикс или фичу без слияния всей ветки",
      "Когда нужно отменить коммит в текущей ветке",
      "Всегда, вместо git merge — это безопаснее",
    ],
    correctIndex: 1,
    explanation:
      "cherry-pick идеален для точечного переноса: критический патч из незаконченной feature-ветки, перенос фикса между release-ветками, применение одного коммита на нескольких ветках. Не используй его как замену merge — это создаёт дублирующиеся коммиты.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Перенеси конкретный коммит",
  description:
    "Создай feature-ветку с несколькими коммитами. Затем с помощью cherry-pick перенеси только один из них в main.",
  hint: "1) git switch -c feature/test. 2) Сделай 2-3 коммита. 3) git log --oneline (запомни хеш нужного коммита). 4) git switch main. 5) git cherry-pick <хеш>. 6) git log --oneline — увидишь новый коммит с другим хешем!",
  verificationSteps: [
    "Создал feature-ветку с несколькими коммитами",
    "Запомнил или скопировал хеш нужного коммита (git log --oneline)",
    "Переключился на main (git switch main)",
    "Выполнил git cherry-pick <хеш>",
    "Проверил git log --oneline — новый коммит появился с другим хешем",
    "Убедился, что оригинальный коммит в feature-ветке остался (git log --oneline feature/test)",
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
              text="Команда работает над большой feature/payments — Stripe, PayPal, и много другого. Ветка ещё не готова к релизу. Но сегодня обнаружили критическую уязвимость безопасности, и патч уже есть в этой ветке."
            />
            <NarrativeBox
              text="Ждать, пока вся feature-ветка будет готова? Слишком опасно. Слить всю ветку? Туда попадёт незаконченный код. Решение: git cherry-pick — взять конкретный коммит с патчем и перенести только его в main."
            />
            <NarrativeBox
              text="cherry-pick буквально означает «выбирать лучшее». Git берёт изменения из указанного коммита и создаёт новый коммит в текущей ветке с теми же изменениями, но другим хешем."
            />
            <NarrativeBox
              text="Важно: cherry-pick создаёт КОПИЮ коммита. Оригинал остаётся в исходной ветке. Если потом ты всё-таки сольёшь ветку, могут появиться конфликты или дублирующийся код — имей это в виду."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать cherry-pick!
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
            <NarrativeBox text="Смотри: коммит из feature/payments 'копируется' в main. Хеш меняется — это новый коммит с тем же содержимым. Оригинал остаётся в feature-ветке." />

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
                {vizStep === 0 ? "git cherry-pick f7e6d5c" : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=22-cherry-pick"
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
            <NarrativeBox text="Два вопроса про cherry-pick: что происходит с хешем и когда это уместно использовать." />

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
            <NarrativeBox text="Создай ситуацию из реальной жизни: несколько коммитов в feature-ветке, и нужен только один из них в main. Убедись своими глазами, что хеш изменился!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
