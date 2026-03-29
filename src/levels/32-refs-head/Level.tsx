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
  { text: "# HEAD — файл, который указывает на текущую ветку", type: "output" as const },
  { text: "cat .git/HEAD", type: "command" as const },
  { text: "ref: refs/heads/main", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Refs — файлы с SHA-1 хешем коммита", type: "output" as const },
  { text: "cat .git/refs/heads/main", type: "command" as const },
  { text: "a95b4e1c9e2f3d4567890abcdef1234567890abcd", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# git symbolic-ref — читает symbolic ref", type: "output" as const },
  { text: "git symbolic-ref HEAD", type: "command" as const },
  { text: "refs/heads/main", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# После создания новой ветки появляется новый файл", type: "output" as const },
  { text: "git switch -c feature/new-ui", type: "command" as const },
  { text: "Switched to a new branch 'feature/new-ui'", type: "success" as const },
  { text: "cat .git/HEAD", type: "command" as const },
  { text: "ref: refs/heads/feature/new-ui", type: "success" as const },
  { text: "cat .git/refs/heads/feature/new-ui", type: "command" as const },
  { text: "a95b4e1c9e2f3d4567890abcdef1234567890abcd", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# В detached HEAD state — прямой SHA-1 в HEAD", type: "output" as const },
  { text: "git checkout a95b4e1", type: "command" as const },
  { text: "HEAD is now at a95b4e1 Initial commit", type: "output" as const },
  { text: "cat .git/HEAD", type: "command" as const },
  { text: "a95b4e1c9e2f3d4567890abcdef1234567890abcd", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# packed-refs — упакованные refs (для старых/удалённых веток)", type: "output" as const },
  { text: "cat .git/packed-refs", type: "command" as const },
  { text: "# pack-refs with: peeled fully-peeled sorted", type: "output" as const },
  { text: "b72c3d9f0a1e4567890abcdef1234567890bcde refs/remotes/origin/main", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a95b4e1", message: "Initial commit", branch: "main", parent: undefined },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "cat .git/HEAD → ref: refs/heads/main",
    narration: "HEAD — это файл .git/HEAD. Обычно он содержит symbolic ref: 'ref: refs/heads/main'. Это означает: HEAD указывает на ветку main, а main указывает на конкретный коммит.",
    addBranches: [{ name: "main", commitId: "a95b4e1", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "a95b4e1",
  },
  {
    command: "git switch -c feature/new-ui",
    narration: "Создание ветки — это просто создание нового файла в .git/refs/heads/. Файл feature/new-ui содержит тот же SHA-1 что и main. HEAD обновляется: теперь он указывает на refs/heads/feature/new-ui.",
    addCommits: [
      { id: "b2c3d4e", message: "feat: new UI component", branch: "feature/new-ui", parent: "a95b4e1" },
    ],
    addBranches: [{ name: "feature/new-ui", commitId: "b2c3d4e", color: "#10b981" }],
    moveHead: "feature/new-ui",
    highlight: "b2c3d4e",
  },
  {
    command: "git checkout a95b4e1 (detached HEAD)",
    narration: "Detached HEAD: когда ты checkout'аешь коммит напрямую (не ветку), HEAD содержит SHA-1 хеш, а не symbolic ref. Ты 'оторван' от всех веток. Коммиты возможны, но без ветки они могут быть потеряны при переключении.",
    addBranches: [{ name: "main", commitId: "a95b4e1", color: "#3b82f6" }],
    moveHead: "a95b4e1",
    highlight: "a95b4e1",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что содержит файл .git/HEAD при обычной работе с веткой main?",
    options: [
      "SHA-1 хеш последнего коммита",
      "Имя репозитория и URL remote",
      "ref: refs/heads/main",
      "Список всех веток репозитория",
    ],
    correctIndex: 2,
    explanation:
      "В обычном состоянии .git/HEAD содержит symbolic ref: строку 'ref: refs/heads/main' (или имя текущей ветки). Это symbolic ref — ссылка на ссылку. Git сначала читает HEAD, получает путь к ветке, затем читает файл ветки из .git/refs/heads/ и получает SHA-1 текущего коммита.",
  },
  {
    question: "Что такое 'detached HEAD'?",
    options: [
      "Ошибка Git, требующая восстановления",
      "HEAD указывает напрямую на SHA-1 коммита, а не на ветку",
      "Состояние когда HEAD файл был удалён",
      "HEAD указывает на удалённую ветку (origin/main)",
    ],
    correctIndex: 1,
    explanation:
      "Detached HEAD — это состояние когда .git/HEAD содержит SHA-1 хеш напрямую, а не symbolic ref (ref: refs/heads/...). Это происходит при git checkout <commit-hash>. Ты можешь делать коммиты, но они не привязаны ни к одной ветке и могут быть потеряны при переключении. Чтобы сохранить работу — создай ветку: git switch -c new-branch.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Исследуй refs и HEAD вручную",
  description:
    "Загляни в .git/HEAD и .git/refs/heads/ своего репозитория. Поэкспериментируй с detached HEAD!",
  hint: "1) В любом git репо: cat .git/HEAD — видишь symbolic ref. 2) cat .git/refs/heads/main (или master) — видишь SHA-1. 3) git symbolic-ref HEAD — то же через Git. 4) git log --oneline -1 — сравни с SHA-1 в refs. 5) git checkout HEAD~1 — войди в detached HEAD. 6) cat .git/HEAD — теперь прямой SHA-1! 7) git switch main — вернись обратно.",
  verificationSteps: [
    "Выполнил cat .git/HEAD — увидел 'ref: refs/heads/...'",
    "Прочитал .git/refs/heads/<branch> — увидел SHA-1 коммита",
    "Использовал git symbolic-ref HEAD для чтения symbolic ref",
    "Вошёл в detached HEAD через git checkout HEAD~1 (или git checkout <hash>)",
    "Убедился, что cat .git/HEAD теперь содержит SHA-1 напрямую",
    "Вернулся в нормальное состояние через git switch main",
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
              text="Последний секрет Git internals: refs и HEAD. Ветки — это просто файлы! А HEAD — файл, который говорит Git 'ты сейчас здесь'."
            />
            <NarrativeBox
              text="Ref (ссылка) — это файл в .git/refs/heads/, содержащий один SHA-1 хеш. Создание ветки — это буквально создание файла с 40-символьным хешем. Вот почему ветки в Git такие лёгкие: они ничего не копируют, просто хранят один хеш!"
            />
            <NarrativeBox
              text="HEAD — это файл .git/HEAD. Обычно он содержит symbolic ref: 'ref: refs/heads/main'. Git читает HEAD → находит файл ветки → читает SHA-1 коммита. Команда git symbolic-ref HEAD показывает symbolic ref без чтения файла вручную."
            />
            <NarrativeBox
              text="Packed refs: когда веток становится много или старые ветки удаляются, Git упаковывает refs в один файл .git/packed-refs. Это оптимизация производительности. Detached HEAD: если HEAD содержит SHA-1 напрямую (не symbolic ref), ты 'оторван' от веток — будь осторожен с новыми коммитами!"
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Читаем файлы Git!
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
            <NarrativeBox text="Смотри как HEAD и refs меняются при переключении веток и в detached HEAD состоянии. Это просто файлы на диске!" />

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
                  ? "Создать ветку"
                  : vizStep === 1
                  ? "Detached HEAD"
                  : vizStep === 2
                  ? "HEAD без ветки"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=32-refs-head"
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
            <NarrativeBox text="Два вопроса про refs и HEAD. Понимание этих механизмов объяснит почему ветки в Git такие быстрые и лёгкие." />

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
            <NarrativeBox text="Читай файлы Git напрямую как настоящий хакер! .git/HEAD и .git/refs/heads/ расскажут всё о состоянии репозитория." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
