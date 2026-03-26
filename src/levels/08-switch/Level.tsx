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
  { text: "# Создаём ветку и переключаемся на неё (старый способ)", type: "output" as const },
  { text: "git checkout -b feature/login", type: "command" as const },
  { text: "Switched to a new branch 'feature/login'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Современный способ (Git 2.23+)", type: "output" as const },
  { text: "git switch -c feature/login", type: "command" as const },
  { text: "Switched to a new branch 'feature/login'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Делаем коммит на feature/login", type: "output" as const },
  { text: "echo 'login page' > login.html", type: "command" as const },
  { text: "git add login.html", type: "command" as const },
  { text: "git commit -m 'feat: add login page'", type: "command" as const },
  { text: "[feature/login c3d4e5f] feat: add login page", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Возвращаемся на main", type: "output" as const },
  { text: "git switch main", type: "command" as const },
  { text: "Switched to branch 'main'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# login.html исчез — он существует только в feature/login!", type: "output" as const },
  { text: "ls", type: "command" as const },
  { text: "README.md  src/", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial setup", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add user model", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: HEAD на main",
    narration: "HEAD указывает на main. Мы на ветке main. HEAD — это указатель на 'где ты сейчас находишься'.",
    addBranches: [{ name: "main", commitId: "b2c3d4e", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git switch -c feature/login",
    narration: "Создали ветку feature/login И переключились на неё. HEAD теперь указывает на feature/login. Обе ветки смотрят на один коммит b2c3d4e — пока они идентичны.",
    addBranches: [{ name: "feature/login", commitId: "b2c3d4e", color: "#10b981" }],
    moveHead: "feature/login",
    highlight: "b2c3d4e",
  },
  {
    command: "git commit -m 'feat: add login page'",
    narration: "Новый коммит на feature/login! Ветки разошлись: feature/login ушла вперёд, main осталась на b2c3d4e. Именно так работает параллельная разработка.",
    addCommits: [{ id: "c3d4e5f", message: "feat: add login page", branch: "feature/login", parent: "b2c3d4e" }],
    addBranches: [{ name: "feature/login", commitId: "c3d4e5f", color: "#10b981" }],
    moveHead: "feature/login",
    highlight: "c3d4e5f",
  },
  {
    command: "git switch main",
    narration: "Переключились обратно на main. HEAD снова на main, указывает на b2c3d4e. Файлы в рабочей папке изменились — login.html исчез, ведь его нет в main.",
    moveHead: "main",
    highlight: "b2c3d4e",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Чем отличается git switch -c feature/x от git branch feature/x?",
    options: [
      "Ничем, это одно и то же",
      "git switch -c создаёт ветку И переключается на неё, git branch только создаёт",
      "git switch -c удаляет старую ветку перед созданием новой",
      "git branch feature/x переключается, а git switch -c только создаёт",
    ],
    correctIndex: 1,
    explanation:
      "git branch <name> только создаёт ветку, оставляя тебя на текущей. git switch -c <name> (или старый git checkout -b <name>) делает два действия сразу: создаёт ветку и немедленно переключается на неё. Флаг -c означает --create.",
  },
  {
    question: "Ты на ветке feature/login, сделал коммит. Переключился на main. Что произошло с файлами в рабочей папке?",
    options: [
      "Файлы остались те же — Git не меняет файлы при переключении",
      "Все файлы удалились — Git очистил рабочую папку",
      "Файлы изменились: теперь показывается состояние ветки main (файлы из feature/login исчезли)",
      "Файлы слились — теперь видны изменения обеих веток",
    ],
    correctIndex: 2,
    explanation:
      "При переключении веток Git обновляет рабочую папку: файлы, существующие только в feature/login, исчезнут; файлы main появятся. Это не потеря данных — всё сохранено в истории Git и снова появится при переключении обратно на feature/login.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Работай в ветке",
  description:
    "Создай ветку для новой фичи, переключись на неё, сделай коммит и вернись на main. Убедись, что изменения остались в feature-ветке.",
  hint: "git switch -c feature/my-feature (или git checkout -b feature/my-feature). Создай файл, сделай git add + git commit. Потом git switch main. Проверь ls — файла нет. Git switch feature/my-feature — файл снова есть!",
  verificationSteps: [
    "Создал ветку с git switch -c (или git checkout -b) и переключился на неё",
    "Создал новый файл и сделал коммит на feature-ветке",
    "Переключился обратно на main через git switch main",
    "Убедился, что файл из feature-ветки не виден в main",
    "Переключился обратно на feature-ветку и увидел файл снова",
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
              text="Ты уже умеешь создавать ветки через git branch. Но создать — это полдела. Нужно ещё и переключиться на неё, чтобы начать работать. Именно это делает git switch."
            />
            <NarrativeBox
              text="В Git 2.23 появилась команда git switch — она делает одно дело, но делает его хорошо: переключает ветки. Раньше для этого использовали git checkout, который умеет слишком много разных вещей (и путает новичков)."
            />
            <NarrativeBox
              text="Ключевой момент: при переключении веток Git обновляет файлы в твоей рабочей папке. Файлы, существующие только в новой ветке, появятся. Файлы, которых нет в новой ветке, исчезнут. Но ничего не теряется — всё хранится в истории."
            />
            <NarrativeBox
              text="Сокращение для частого сценария «создать и переключиться»: git switch -c new-branch (аналог старого git checkout -b new-branch). Флаг -c означает --create."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать переключение!
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
            <NarrativeBox text="Смотри как HEAD перемещается при переключении веток. После коммита ветки расходятся — это и есть параллельная разработка!" />

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
                  ? "git switch -c feature/login"
                  : vizStep === 1
                  ? "git commit (на feature)"
                  : vizStep === 2
                  ? "git switch main"
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
            <NarrativeBox text="Разберёмся в отличиях команд и в том, что происходит с файлами при переключении веток." />

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
            <NarrativeBox text="Пора почувствовать магию веток на своём компьютере — как файлы появляются и исчезают при переключении!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
