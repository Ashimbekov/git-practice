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
  { text: "# Смотрим текущее состояние", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "b2c3d4e (HEAD -> main, origin/main) feat: initial setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Получаем изменения БЕЗ слияния", type: "output" as const },
  { text: "git fetch origin", type: "command" as const },
  { text: "remote: Enumerating objects: 8, done.", type: "output" as const },
  { text: "remote: Counting objects: 100% (8/8), done.", type: "output" as const },
  { text: "remote: Compressing objects: 100% (5/5), done.", type: "output" as const },
  { text: "Unpacking objects: 100% (5/5), done.", type: "output" as const },
  { text: "From https://github.com/user/project", type: "output" as const },
  { text: "   b2c3d4e..f6g7h8i  main -> origin/main", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Локальный main НЕ изменился — только origin/main обновился", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "b2c3d4e (HEAD -> main) feat: initial setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Смотрим что появилось на сервере", type: "output" as const },
  { text: "git log --oneline origin/main", type: "command" as const },
  { text: "f6g7h8i (origin/main) feat: add payment system", type: "success" as const },
  { text: "e5f6g7h feat: add cart", type: "output" as const },
  { text: "b2c3d4e feat: initial setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Изучаем изменения перед слиянием", type: "output" as const },
  { text: "git diff main..origin/main", type: "command" as const },
  { text: "+++ b/payment.js", type: "success" as const },
  { text: "@@ -0,0 +1,42 @@", type: "output" as const },
  { text: "+function processPayment(amount) {", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Теперь сливаем (осознанно!)", type: "output" as const },
  { text: "git merge origin/main", type: "command" as const },
  { text: "Updating b2c3d4e..f6g7h8i", type: "output" as const },
  { text: "Fast-forward", type: "success" as const },
  { text: " payment.js | 42 ++++++++++++++++++++++++++++++++++++++++++", type: "output" as const },
  { text: " cart.js    | 28 ++++++++++++++++++++++++++++", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: initial setup", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: main и origin/main совпадают",
    narration: "Твой локальный main и origin/main указывают на один коммит. Но на сервере уже появились новые коммиты, о которых ты не знаешь.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "origin/main", commitId: "b2c3d4e", color: "#f59e0b" },
    ],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git fetch origin",
    narration: "git fetch скачивает новые коммиты e5f6g7h и f6g7h8i с сервера, и обновляет origin/main. Но твой локальный main остаётся на b2c3d4e — ничего не сломалось, ты можешь спокойно изучить изменения!",
    addCommits: [
      { id: "e5f6g7h", message: "feat: add cart", branch: "main", parent: "b2c3d4e" },
      { id: "f6g7h8i", message: "feat: add payment system", branch: "main", parent: "e5f6g7h" },
    ],
    addBranches: [
      { name: "origin/main", commitId: "f6g7h8i", color: "#f59e0b" },
    ],
    moveHead: "main",
    highlight: "f6g7h8i",
  },
  {
    command: "git merge origin/main",
    narration: "После изучения изменений (git log origin/main, git diff) — ты готов слить. git merge origin/main применяет скачанные коммиты к локальному main. Теперь всё синхронизировано!",
    addBranches: [
      { name: "main", commitId: "f6g7h8i", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "f6g7h8i",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "В чём главное отличие git fetch от git pull?",
    options: [
      "git fetch работает быстрее, потому что скачивает меньше данных",
      "git fetch скачивает изменения в origin/main, НЕ меняя локальную ветку; git pull скачивает И сразу сливает с текущей веткой",
      "git fetch используется для получения новых веток, git pull — для коммитов",
      "Разницы нет — это одна и та же команда с разными именами",
    ],
    correctIndex: 1,
    explanation:
      "git fetch безопасно скачивает изменения с сервера в tracking-ветки (origin/main и т.д.), не изменяя твой локальный код. Ты можешь изучить что изменилось, прежде чем решить сливать или нет. git pull = fetch + merge: удобно, но сразу применяет изменения.",
  },
  {
    question: "Как посмотреть коммиты, которые есть на сервере, но нет локально, после git fetch?",
    options: [
      "git status — он покажет разницу с сервером",
      "git log --remote — специальная команда для remote-коммитов",
      "git log origin/main или git log main..origin/main — смотреть историю tracking-ветки",
      "Нельзя посмотреть — нужно сразу сделать git merge",
    ],
    correctIndex: 2,
    explanation:
      "После git fetch обновляется tracking-ветка origin/main. Посмотреть её историю: git log origin/main. Посмотреть только новые коммиты (которых нет локально): git log main..origin/main. Изучить конкретные изменения: git diff main..origin/main. Это позволяет принять осознанное решение — сливать или нет.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Сделай fetch и изучи изменения перед слиянием",
  description:
    "Внеси изменение в репозиторий на GitHub (через веб-интерфейс), затем локально выполни git fetch (не git pull!). Изучи что появилось, затем слей командой git merge origin/main.",
  hint: "На GitHub: редактируй файл прямо в браузере. Локально: git fetch origin → git log --oneline origin/main (видишь новый коммит!) → git diff main..origin/main (видишь изменения) → git merge origin/main (сливаешь осознанно)",
  verificationSteps: [
    "Внёс изменение на GitHub через веб-интерфейс",
    "Выполнил git fetch origin (не git pull!)",
    "Проверил git log --oneline origin/main — увидел новый коммит",
    "Посмотрел git diff main..origin/main — изучил изменения",
    "Выполнил git merge origin/main — слил изменения",
    "Проверил git log --oneline — локальный main обновился",
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
              text="Ты уже умеешь делать git pull — получать и сразу применять изменения. Но что если ты хочешь сначала посмотреть что изменилось? Знакомься с git fetch — более осторожным братом git pull."
            />
            <NarrativeBox
              text="git fetch скачивает все новые коммиты с сервера, но не трогает твой локальный код. Изменения попадают только в tracking-ветку (origin/main). Твой локальный main остаётся нетронутым."
            />
            <NarrativeBox
              text="Зачем это нужно? Ты можешь изучить изменения (git log origin/main, git diff main..origin/main), убедиться что они безопасны, и только потом слить (git merge origin/main). Это особенно полезно в больших командах."
            />
            <NarrativeBox
              text="Запомни: git pull = git fetch + git merge. Если хочешь контроль — делай fetch и merge раздельно. Если хочешь удобство — используй pull."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать fetch в деле!
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
            <NarrativeBox text="Смотри: fetch обновляет origin/main, не трогая локальный main. После изучения — merge приводит их в соответствие." />

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
                  ? "git fetch origin"
                  : vizStep === 1
                  ? "git merge origin/main"
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
            <NarrativeBox text="Два вопроса про fetch vs pull — ключевое различие для осознанной работы с remote!" />

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
            <NarrativeBox text="Попробуй осознанный workflow: fetch → изучи → merge. Это профессиональный подход!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
