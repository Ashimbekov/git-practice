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
  { text: "# Мы на main, feature/login готова — сливаем", type: "output" as const },
  { text: "git switch main", type: "command" as const },
  { text: "Switched to branch 'main'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Fast-forward merge (main не уходила вперёд)", type: "output" as const },
  { text: "git merge feature/login", type: "command" as const },
  { text: "Updating b2c3d4e..c3d4e5f", type: "output" as const },
  { text: "Fast-forward", type: "success" as const },
  { text: " login.html | 1 +", type: "output" as const },
  { text: " 1 file changed, 1 insertion(+)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Пример 3-way merge (если main тоже двигалась)", type: "output" as const },
  { text: "git merge feature/signup", type: "command" as const },
  { text: "Merge made by the 'ort' strategy.", type: "success" as const },
  { text: " signup.html | 5 +++++", type: "output" as const },
  { text: " 1 file changed, 5 insertions(+)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "git log --oneline --graph", type: "command" as const },
  { text: "*   e4f5g6h (HEAD -> main) Merge branch 'feature/signup'", type: "output" as const },
  { text: "|\\", type: "output" as const },
  { text: "| * d3e4f5g feat: add signup page", type: "output" as const },
  { text: "* | c3d4e5f feat: add login page", type: "output" as const },
  { text: "|/", type: "output" as const },
  { text: "* b2c3d4e feat: add user model", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial setup", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add user model", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: main и feature/login",
    narration: "Ветка feature/login создана от main. Пока обе указывают на b2c3d4e — они идентичны.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "feature/login", commitId: "b2c3d4e", color: "#10b981" },
    ],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git commit (на feature/login: 'feat: add login page')",
    narration: "Разработчик сделал коммит на feature/login. Ветки разошлись: feature/login ушла вперёд, main осталась на b2c3d4e.",
    addCommits: [
      { id: "c3d4e5f", message: "feat: add login page", branch: "feature/login", parent: "b2c3d4e" },
    ],
    addBranches: [{ name: "feature/login", commitId: "c3d4e5f", color: "#10b981" }],
    moveHead: "feature/login",
    highlight: "c3d4e5f",
  },
  {
    command: "git switch main && git merge feature/login",
    narration: "Fast-forward merge! main просто «перемотала» указатель вперёд до c3d4e5f. Никакого merge commit — история линейная. Это возможно, потому что main не уходила вперёд от точки ветвления.",
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
  {
    command: "# 3-way merge: main тоже двигалась",
    narration: "Теперь более сложный случай. main и feature/signup разошлись — у каждой свои уникальные коммиты. Простой перемоткой тут не обойтись.",
    addCommits: [
      { id: "d3e4f5g", message: "feat: add signup page", branch: "feature/signup", parent: "b2c3d4e" },
    ],
    addBranches: [{ name: "feature/signup", commitId: "d3e4f5g", color: "#f59e0b" }],
    moveHead: "main",
    highlight: "d3e4f5g",
  },
  {
    command: "git merge feature/signup",
    narration: "3-way merge создаёт merge commit e4f5g6h — у него ДВА родителя: c3d4e5f (из main) и d3e4f5g (из feature/signup). Это «точка объединения» двух историй. История перестаёт быть линейной.",
    addCommits: [
      {
        id: "e4f5g6h",
        message: "Merge branch 'feature/signup'",
        branch: "main",
        parent: "c3d4e5f",
        secondParent: "d3e4f5g",
      },
    ],
    addBranches: [{ name: "main", commitId: "e4f5g6h", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "e4f5g6h",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Когда происходит fast-forward merge?",
    options: [
      "Всегда — это стандартный режим git merge",
      "Когда целевая ветка (в которую сливаем) не имеет новых коммитов с момента ветвления",
      "Когда обе ветки имеют одинаковое количество коммитов",
      "Когда файлы не конфликтуют между ветками",
    ],
    correctIndex: 1,
    explanation:
      "Fast-forward возможен, когда ветка-приёмник (например main) не двигалась с момента создания ветки-источника. Тогда Git просто перемещает указатель вперёд — без создания merge commit. История остаётся линейной.",
  },
  {
    question: "Что такое merge commit и чем он особенный?",
    options: [
      "Обычный коммит с пометкой 'merge' в сообщении",
      "Коммит с двумя родителями, который объединяет истории двух веток",
      "Последний коммит перед слиянием веток",
      "Автоматически созданный коммит для разрешения конфликтов",
    ],
    correctIndex: 1,
    explanation:
      "Merge commit особенный тем, что у него два родителя (parent и secondParent) — по одному от каждой сливаемой ветки. Это 'точка объединения' двух историй. Git log --graph покажет это красивым ромбом в графе.",
  },
  {
    question: "Когда Git создаёт merge commit (3-way merge вместо fast-forward)?",
    options: [
      "Всегда при использовании git merge",
      "Только при конфликтах в файлах",
      "Когда обе ветки имеют коммиты, сделанные независимо после точки ветвления",
      "Когда ветки находятся в разных репозиториях",
    ],
    correctIndex: 2,
    explanation:
      "3-way merge (и создание merge commit) происходит, когда обе ветки 'разошлись' — каждая имеет свои уникальные коммиты после точки ветвления. Git анализирует три состояния: общий предок, конец первой ветки, конец второй ветки — отсюда название '3-way'.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Слей свою первую ветку",
  description:
    "Создай feature-ветку, сделай на ней коммит, вернись на main и слей ветки. Посмотри результат через git log --oneline --graph.",
  hint: "git switch -c feature/test → создай файл → git add + git commit → git switch main → git merge feature/test. Посмотри git log --oneline --graph. Был ли это fast-forward?",
  verificationSteps: [
    "Создал feature-ветку и переключился на неё",
    "Сделал минимум один коммит на feature-ветке",
    "Вернулся на main (git switch main)",
    "Выполнил git merge feature/<имя-ветки>",
    "Проверил git log --oneline --graph — увидел результат слияния",
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
              text="Фича готова, тесты прошли. Теперь нужно влить изменения обратно в main — это называется merge (слияние). git merge объединяет историю двух веток."
            />
            <NarrativeBox
              text="Есть два сценария. Fast-forward: если main не двигалась пока ты работал в feature-ветке, Git просто «перематывает» main вперёд. Никакого лишнего коммита, история остаётся линейной."
            />
            <NarrativeBox
              text="3-way merge: если main тоже получала коммиты пока ты работал (например, коллега залил другую фичу), ветки «разошлись». Git создаёт специальный merge commit с двумя родителями — он объединяет обе истории."
            />
            <NarrativeBox
              text="Правило: git merge выполняется на ветке-приёмнике. Чтобы влить feature/login в main — переключись на main, затем вызови git merge feature/login. Не наоборот!"
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать слияние!
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
            <NarrativeBox text="Смотри внимательно: fast-forward просто двигает указатель, а 3-way merge создаёт коммит с двумя родителями — граф ветвится!" />

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
                  ? "Коммит на feature/login"
                  : vizStep === 1
                  ? "git merge (fast-forward)"
                  : vizStep === 2
                  ? "Добавить feature/signup"
                  : vizStep === 3
                  ? "git merge (3-way)"
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
            <NarrativeBox text="Три вопроса про слияние. Разберись в разнице между fast-forward и 3-way merge — это важно для понимания истории репозитория." />

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
            <NarrativeBox text="Выполни полный цикл разработки: создай ветку → сделай коммит → слей в main. Это твой ежедневный рабочий процесс!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
