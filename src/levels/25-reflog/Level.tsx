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
  { text: "# Катастрофа: случайно сделал git reset --hard на 3 коммита назад", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "a1b2c3d (HEAD -> main) feat: initial commit", type: "output" as const },
  { text: "# Где мои коммиты?! git log их не видит...", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Спасение: git reflog — журнал ВСЕХ движений HEAD", type: "output" as const },
  { text: "git reflog", type: "command" as const },
  { text: "a1b2c3d (HEAD -> main) HEAD@{0}: reset: moving to HEAD~3", type: "output" as const },
  { text: "d4e5f6g HEAD@{1}: commit: feat: add payment gateway", type: "output" as const },
  { text: "c3d4e5f HEAD@{2}: commit: feat: add shopping cart", type: "output" as const },
  { text: "b2c3d4e HEAD@{3}: commit: feat: add product catalog", type: "output" as const },
  { text: "a1b2c3d HEAD@{4}: commit (initial): feat: initial commit", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Видим потерянные коммиты! Восстанавливаем:", type: "output" as const },
  { text: "git reset --hard d4e5f6g", type: "command" as const },
  { text: "HEAD is now at d4e5f6g feat: add payment gateway", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "d4e5f6g (HEAD -> main) feat: add payment gateway", type: "output" as const },
  { text: "c3d4e5f feat: add shopping cart", type: "output" as const },
  { text: "b2c3d4e feat: add product catalog", type: "output" as const },
  { text: "a1b2c3d feat: initial commit", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Коммиты восстановлены! reflog спас ситуацию.", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add product catalog", branch: "main", parent: "a1b2c3d" },
  { id: "c3d4e5f", message: "feat: add shopping cart", branch: "main", parent: "b2c3d4e" },
  { id: "d4e5f6g", message: "feat: add payment gateway", branch: "main", parent: "c3d4e5f" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# До катастрофы: 4 коммита",
    narration: "Четыре коммита, HEAD на d4e5f6g. Сейчас всё хорошо — но сейчас мы случайно всё потеряем.",
    addBranches: [{ name: "main", commitId: "d4e5f6g", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "d4e5f6g",
  },
  {
    command: "git reset --hard HEAD~3  (катастрофа!)",
    narration: "git reset --hard HEAD~3 откатил HEAD на 3 коммита назад. Коммиты b2c3d4e, c3d4e5f, d4e5f6g 'исчезли' из git log. Кажется, что они удалены навсегда. Но Git помнит всё...",
    addBranches: [{ name: "main", commitId: "a1b2c3d", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "a1b2c3d",
  },
  {
    command: "git reset --hard d4e5f6g  (восстановление через reflog)",
    narration: "reflog показал хеш d4e5f6g. git reset --hard d4e5f6g восстановил HEAD на прежнее место. Коммиты снова видны в git log! Объекты в .git/objects никуда не делись — Git просто не показывал их, ведь HEAD не указывал на них.",
    addBranches: [{ name: "main", commitId: "d4e5f6g", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "d4e5f6g",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что показывает git reflog?",
    options: [
      "Только историю коммитов, как git log",
      "Все перемещения HEAD: коммиты, переключения веток, reset, rebase и т.д.",
      "Историю команд, которые ты вводил в терминале",
      "Список удалённых файлов в репозитории",
    ],
    correctIndex: 1,
    explanation:
      "git reflog — это журнал всех позиций HEAD за последнее время (по умолчанию 90 дней). Он фиксирует каждое движение HEAD: коммит, переключение ветки, reset, rebase, cherry-pick. В отличие от git log, reflog видит даже 'потерянные' коммиты, на которые больше нет ссылок.",
  },
  {
    question: "После git reset --hard HEAD~2 ты потерял 2 коммита. Как их восстановить?",
    options: [
      "Никак — hard reset необратим",
      "git undo",
      "git reflog → найти хеш нужного коммита → git reset --hard <хеш>",
      "git restore --source=HEAD~2",
    ],
    correctIndex: 2,
    explanation:
      "reflog — твоя страховочная сетка. Даже после git reset --hard объекты коммитов остаются в .git/objects (пока не запустится git gc). reflog показывает хеши всех позиций HEAD. Найди нужный хеш (HEAD@{N} до сброса) и сделай git reset --hard <хеш> — коммиты вернутся.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Найди «потерянный» коммит через reflog",
  description:
    "Создай несколько коммитов, намеренно сделай git reset --hard назад, затем используй reflog, чтобы найти и восстановить «потерянные» коммиты.",
  hint: "1) Сделай 3 коммита. 2) git reset --hard HEAD~2 (теряем 2 коммита). 3) git log --oneline — видишь только 1. 4) git reflog — находишь хеши! 5) git reset --hard <хеш последнего коммита>. 6) git log --oneline — все 3 вернулись!",
  verificationSteps: [
    "Создал минимум 3 коммита на ветке",
    "Выполнил git reset --hard HEAD~2 (или HEAD~1)",
    "Убедился, что git log --oneline показывает меньше коммитов",
    "Выполнил git reflog — нашёл хеш «потерянного» коммита",
    "Выполнил git reset --hard <найденный хеш>",
    "Убедился, что git log --oneline снова показывает все коммиты",
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
              text="Ты случайно выполнил git reset --hard HEAD~3. Три коммита с важным кодом исчезли из git log. Паника? Не спеши — у Git есть секретное оружие."
            />
            <NarrativeBox
              text="git reflog — это журнал всех позиций HEAD за последние 90 дней. Git записывает каждое движение HEAD: коммит, переключение ветки, reset, rebase, cherry-pick. Даже 'потерянные' коммиты там есть."
            />
            <NarrativeBox
              text="Вот почему: git reset --hard не удаляет объекты коммитов из .git/objects — он просто двигает указатель HEAD. Объекты остаются до тех пор, пока не запустится git gc (сборка мусора). reflog показывает хеши этих 'невидимых' коммитов."
            />
            <NarrativeBox
              text="Алгоритм спасения: 1) git reflog — найди строку с нужным коммитом до катастрофы. 2) Скопируй хеш (например HEAD@{3}). 3) git reset --hard <хеш> — HEAD возвращается на место. Коммиты воскресли!"
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать спасение через reflog!
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
            <NarrativeBox text="Смотри: после reset --hard коммиты 'исчезают' из графа. Но reflog их помнит — и мы можем вернуть HEAD обратно." />

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
                  ? "git reset --hard HEAD~3 (катастрофа)"
                  : vizStep === 1
                  ? "git reset --hard d4e5f6g (спасение)"
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
            <NarrativeBox text="Два вопроса про reflog. Запомни: reflog — твоя машина времени в Git. Пока gc не почистил объекты, ничего не потеряно." />

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
            <NarrativeBox text="Симулируй катастрофу и спасись через reflog. Это упражнение навсегда избавит тебя от паники при случайном reset --hard!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
