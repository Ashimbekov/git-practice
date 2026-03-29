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
  { text: "git log --oneline", type: "command" as const },
  { text: "d4e5f6g (HEAD -> main) feat: new checkout flow", type: "output" as const },
  { text: "c3d4e5f feat: add promo codes", type: "output" as const },
  { text: "b2c3d4e fix: cart total calculation", type: "output" as const },
  { text: "a1b2c3d feat: initial commit", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# c3d4e5f сломал платёжный модуль — нужно отменить", type: "output" as const },
  { text: "# Но коллеги уже забрали d4e5f6g — нельзя переписывать историю!", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "git revert c3d4e5f", type: "command" as const },
  { text: "[main e5f6g7h] Revert \"feat: add promo codes\"", type: "success" as const },
  { text: " 1 file changed, 15 deletions(-)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "e5f6g7h (HEAD -> main) Revert \"feat: add promo codes\"", type: "output" as const },
  { text: "d4e5f6g feat: new checkout flow", type: "output" as const },
  { text: "c3d4e5f feat: add promo codes", type: "output" as const },
  { text: "b2c3d4e fix: cart total calculation", type: "output" as const },
  { text: "a1b2c3d feat: initial commit", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# История сохранена! c3d4e5f никуда не делся, но его эффект отменён", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "fix: cart total calculation", branch: "main", parent: "a1b2c3d" },
  { id: "c3d4e5f", message: "feat: add promo codes", branch: "main", parent: "b2c3d4e" },
  { id: "d4e5f6g", message: "feat: new checkout flow", branch: "main", parent: "c3d4e5f" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: нужно отменить c3d4e5f",
    narration: "Коммит c3d4e5f сломал прод. Коллеги уже получили d4e5f6g. git reset --hard здесь опасен — он перепишет историю, которую уже видели другие. Нужен безопасный способ.",
    addBranches: [{ name: "main", commitId: "d4e5f6g", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
  {
    command: "git revert c3d4e5f",
    narration: "git revert создаёт НОВЫЙ коммит e5f6g7h, который является «обратным» к c3d4e5f. Если c3d4e5f добавил строки — revert их удалит, и наоборот. Старый коммит c3d4e5f остаётся в истории. История не переписана — безопасно для публичных веток!",
    addCommits: [
      { id: "e5f6g7h", message: "Revert \"feat: add promo codes\"", branch: "main", parent: "d4e5f6g" },
    ],
    addBranches: [{ name: "main", commitId: "e5f6g7h", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "e5f6g7h",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Чем git revert отличается от git reset --hard при отмене коммита?",
    options: [
      "revert быстрее работает, reset точнее",
      "revert создаёт новый коммит-«антидот», сохраняя историю; reset удаляет коммиты из истории",
      "reset работает с локальными ветками, revert — только с удалёнными",
      "Нет разницы — оба дают одинаковый результат",
    ],
    correctIndex: 1,
    explanation:
      "git revert безопасен для публичных веток: он добавляет новый коммит, который «отменяет» эффект указанного коммита, но не стирает историю. git reset --hard удаляет коммиты из истории — опасно, если другие уже получили эти коммиты через push/pull.",
  },
  {
    question: "Ты сделал git revert abc1234. Что произойдёт с коммитом abc1234 в истории?",
    options: [
      "Он будет удалён из git log",
      "Он останется в истории, но рядом появится новый коммит, отменяющий его изменения",
      "Он будет помечен как 'reverted' и скрыт",
      "Он переместится в конец истории",
    ],
    correctIndex: 1,
    explanation:
      "После git revert abc1234 в истории будет ДВА коммита: оригинальный abc1234 (он никуда не делся!) и новый revert-коммит с обратными изменениями. git log покажет оба. Это и делает revert безопасным — история не переписывается.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Отмени коммит безопасно",
  description:
    "Создай коммит с каким-нибудь изменением, затем отмени его через git revert. Убедись, что оба коммита видны в истории.",
  hint: "1) Измени файл и сделай коммит. 2) git log --oneline (запомни хеш). 3) git revert <хеш>. 4) В открывшемся редакторе просто сохрани сообщение (Ctrl+X в nano, :wq в vim). 5) git log --oneline — увидишь оба коммита!",
  verificationSteps: [
    "Создал коммит с каким-либо изменением",
    "Скопировал хеш этого коммита из git log --oneline",
    "Выполнил git revert <хеш>",
    "Сохранил сообщение revert-коммита в редакторе",
    "Проверил git log --oneline — оба коммита видны (оригинальный и Revert \"...\")",
    "Убедился, что изменение из первого коммита было отменено в файле",
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
              text="Пятница, 17:55. Коммит с промо-кодами только что сломал платёжный модуль на проде. Два разработчика уже забрали изменения через git pull. git reset --hard здесь — катастрофа: перепишешь историю, которую видели коллеги."
            />
            <NarrativeBox
              text="Решение: git revert. Вместо удаления коммита из истории — создаётся новый коммит, который делает противоположное. Если проблемный коммит добавил строку — revert её удалит. История не переписывается, коллеги спокойно делают pull."
            />
            <NarrativeBox
              text="Золотое правило: если коммит уже был опубликован (push) и другие его видели — используй revert, не reset. Если коммит только локальный — можно reset."
            />
            <NarrativeBox
              text="git revert открывает редактор для сообщения revert-коммита. По умолчанию сообщение уже заполнено: 'Revert &quot;исходное сообщение&quot;'. Сохрани и закрой редактор — коммит будет создан автоматически."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать revert в действии!
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
            <NarrativeBox text="Смотри: revert добавляет коммит в конец истории. Проблемный c3d4e5f никуда не делся — история сохранена. Новый e5f6g7h нейтрализует его эффект." />

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
                {vizStep === 0 ? "git revert c3d4e5f" : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=24-revert"
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
            <NarrativeBox text="Два ключевых вопроса: чем revert отличается от reset и что происходит с оригинальным коммитом." />

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
            <NarrativeBox text="Попрактикуй безопасную отмену: создай коммит и отмени его через revert. Убедись своими глазами, что история сохраняется — это и есть суть revert." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
