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
  { text: "# Посмотрим на что сейчас указывает HEAD", type: "output" as const },
  { text: "cat .git/HEAD", type: "command" as const },
  { text: "ref: refs/heads/main", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# HEAD указывает на ветку main (нормальный режим)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Переходим к конкретному коммиту (detached HEAD!)", type: "output" as const },
  { text: "git checkout b2c3d4e", type: "command" as const },
  { text: "Note: switching to 'b2c3d4e'.", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "You are in 'detached HEAD' state. You can look around,", type: "error" as const },
  { text: "make experimental changes and commit them, and you can", type: "error" as const },
  { text: "discard any commits you make in this state without impacting", type: "error" as const },
  { text: "any branches by switching back to a branch.", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "cat .git/HEAD", type: "command" as const },
  { text: "b2c3d4e3f5a1c9d8e2f4a6b8c0d2e4f6a8b0c2d4", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# HEAD теперь указывает напрямую на хеш коммита!", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Возвращаемся в нормальный режим", type: "output" as const },
  { text: "git switch main", type: "command" as const },
  { text: "Switched to branch 'main'", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial setup", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add user model", branch: "main", parent: "a1b2c3d" },
  { id: "c3d4e5f", message: "feat: add auth", branch: "main", parent: "b2c3d4e" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Нормальное состояние: HEAD → main → c3d4e5f",
    narration: "HEAD указывает на ветку main, а main указывает на коммит c3d4e5f. HEAD — это 'ты сейчас здесь'. В нормальном режиме HEAD всегда ссылается на ветку, а не напрямую на коммит.",
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
  {
    command: "git commit -m 'feat: new feature'",
    narration: "При новом коммите: создаётся d4e5f6g, ветка main перемещается на него, HEAD остаётся на main. Вот как HEAD «автоматически движется» вместе с веткой при коммитах.",
    addCommits: [{ id: "d4e5f6g", message: "feat: new feature", branch: "main", parent: "c3d4e5f" }],
    addBranches: [{ name: "main", commitId: "d4e5f6g", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "d4e5f6g",
  },
  {
    command: "git checkout b2c3d4e",
    narration: "Detached HEAD! Переключились на старый коммит b2c3d4e напрямую. HEAD теперь указывает не на ветку, а на коммит. Ты «отстыковался» от ветки. Можно смотреть код, но делать коммиты опасно — они потеряются без создания ветки.",
    moveHead: "b2c3d4e",
    highlight: "b2c3d4e",
  },
  {
    command: "git switch main",
    narration: "Вернулись в нормальный режим. HEAD снова указывает на main. Если делал коммиты в detached HEAD — они теперь 'висят в воздухе' и будут удалены сборщиком мусора Git. Чтобы сохранить их, нужно создать ветку: git switch -c my-experiment.",
    moveHead: "main",
    highlight: "d4e5f6g",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что такое HEAD в Git?",
    options: [
      "Первый коммит в репозитории",
      "Имя главной ветки проекта",
      "Указатель на текущее местоположение — обычно ссылается на ветку",
      "Хеш последнего коммита в репозитории",
    ],
    correctIndex: 2,
    explanation:
      "HEAD — это специальный указатель в Git, показывающий 'где ты сейчас находишься'. Обычно HEAD указывает на ветку (например main), а та ветка указывает на конкретный коммит. Когда делаешь коммит, ветка движется вперёд — и HEAD вместе с ней.",
  },
  {
    question: "Ты в detached HEAD state после git checkout <хеш>. Что произойдёт с коммитами, которые ты сделаешь в этом состоянии, если просто переключишься на main?",
    options: [
      "Они автоматически попадут в main",
      "Они сохранятся в специальной ветке detached",
      "Они 'повиснут в воздухе' и будут удалены сборщиком мусора Git",
      "Git запросит подтверждение перед их удалением",
    ],
    correctIndex: 2,
    explanation:
      "В detached HEAD state коммиты не привязаны ни к одной ветке. Если переключиться на другую ветку, эти коммиты станут недоступны и рано или поздно будут удалены garbage collector'ом Git. Чтобы сохранить работу в detached HEAD — создай ветку: git switch -c <branch-name>.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Исследуй HEAD",
  description:
    "Изучи как HEAD перемещается: проверь файл .git/HEAD, войди в detached HEAD state, выйди из него. Убедись что понимаешь разницу.",
  hint: "cat .git/HEAD — видишь 'ref: refs/heads/main'. Запусти git log --oneline и скопируй хеш старого коммита. git checkout <хеш> — теперь в detached HEAD. cat .git/HEAD — теперь видишь хеш напрямую. git switch main — возврат.",
  verificationSteps: [
    "Выполнил cat .git/HEAD и увидел 'ref: refs/heads/...' (нормальный режим)",
    "Выполнил git log --oneline и нашёл хеш старого коммита",
    "Выполнил git checkout <хеш> и увидел предупреждение о detached HEAD",
    "Снова выполнил cat .git/HEAD — теперь там хеш коммита, не ссылка на ветку",
    "Вернулся через git switch main и убедился что HEAD снова нормальный",
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
              text="Ты уже видел слово HEAD в выводе git log и git status. Пора разобраться что это такое. HEAD — это указатель «ты сейчас здесь». Как курсор в тексте, только в графе коммитов."
            />
            <NarrativeBox
              text="В нормальном состоянии HEAD → ветка → коммит. Файл .git/HEAD содержит строку вроде 'ref: refs/heads/main'. Когда делаешь коммит, ветка двигается вперёд, а HEAD вместе с ней — автоматически."
            />
            <NarrativeBox
              text="Но есть особый режим: detached HEAD (отстыкованный HEAD). Он возникает, когда переходишь напрямую к коммиту (git checkout <хеш>). В этом режиме HEAD указывает не на ветку, а прямо на коммит."
            />
            <NarrativeBox
              text="Detached HEAD не опасен для просмотра кода. Но если делать коммиты в этом режиме и потом переключиться на ветку — эти коммиты потеряются. Решение: git switch -c <имя-ветки> чтобы создать ветку и «поймать» их."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать HEAD в деле!
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
            <NarrativeBox text="Смотри как HEAD движется: при коммите — вместе с веткой, при git checkout хеша — отстыковывается от ветки напрямую к коммиту." />

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
                  ? "git commit (HEAD движется)"
                  : vizStep === 1
                  ? "git checkout b2c3d4e (detached!)"
                  : vizStep === 2
                  ? "git switch main (назад)"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=11-head"
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
            <NarrativeBox text="Два вопроса: что такое HEAD и что происходит с коммитами в detached HEAD state." />

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
            <NarrativeBox text="Загляни 'под капот' Git — изучи файл .git/HEAD и почувствуй разницу между нормальным HEAD и detached HEAD." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
