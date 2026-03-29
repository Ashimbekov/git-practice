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
  { text: "# Коллега залил новые коммиты, нужно обновиться", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "b2c3d4e (HEAD -> main, origin/main) feat: initial setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Получаем изменения с сервера", type: "output" as const },
  { text: "git pull origin main", type: "command" as const },
  { text: "remote: Enumerating objects: 5, done.", type: "output" as const },
  { text: "remote: Counting objects: 100% (5/5), done.", type: "output" as const },
  { text: "remote: Compressing objects: 100% (3/3), done.", type: "output" as const },
  { text: "Unpacking objects: 100% (3/3), done.", type: "output" as const },
  { text: "From https://github.com/user/project", type: "output" as const },
  { text: "   b2c3d4e..e5f6g7h  main -> origin/main", type: "output" as const },
  { text: "Updating b2c3d4e..e5f6g7h", type: "output" as const },
  { text: "Fast-forward", type: "success" as const },
  { text: " api/users.js | 15 +++++++++++++++", type: "output" as const },
  { text: " 1 file changed, 15 insertions(+)", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "e5f6g7h (HEAD -> main, origin/main) feat: add users API", type: "success" as const },
  { text: "b2c3d4e feat: initial setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Конфликт при pull (обе стороны изменили один файл)", type: "output" as const },
  { text: "git pull origin main", type: "command" as const },
  { text: "Auto-merging README.md", type: "output" as const },
  { text: "CONFLICT (content): Merge conflict in README.md", type: "error" as const },
  { text: "Automatic merge failed; fix conflicts and then commit the result.", type: "error" as const },
  { text: "# Открой README.md, найди маркеры <<<<<<<, =======, >>>>>>>", type: "output" as const },
  { text: "# Выбери нужный вариант, сохрани, затем:", type: "output" as const },
  { text: "git add README.md && git commit -m 'merge: resolve README conflict'", type: "command" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: initial setup", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Коллега залил новый коммит на сервер",
    narration: "На сервере (origin/main) появился новый коммит e5f6g7h, которого нет у тебя локально. Твой local main отстаёт от origin/main.",
    addCommits: [
      { id: "e5f6g7h", message: "feat: add users API", branch: "main", parent: "b2c3d4e" },
    ],
    addBranches: [
      { name: "origin/main", commitId: "e5f6g7h", color: "#f59e0b" },
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "e5f6g7h",
  },
  {
    command: "git pull origin main",
    narration: "git pull = git fetch + git merge. Сначала скачивает новый коммит e5f6g7h, затем применяет его к локальному main (fast-forward). Теперь ты синхронизирован с командой!",
    addBranches: [
      { name: "main", commitId: "e5f6g7h", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "e5f6g7h",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что на самом деле делает git pull?",
    options: [
      "Только скачивает изменения с сервера, не применяя их",
      "Удаляет локальные изменения и заменяет их серверными",
      "Выполняет git fetch (скачать) + git merge (объединить) — сначала получает изменения, потом сливает с локальной веткой",
      "Создаёт новую ветку с изменениями с сервера",
    ],
    correctIndex: 2,
    explanation:
      "git pull — это сокращение для двух команд: git fetch (скачать изменения с сервера в origin/main) и git merge (слить origin/main с локальным main). Это удобно для быстрой синхронизации, но иногда лучше делать fetch + merge раздельно, чтобы сначала посмотреть что изменилось.",
  },
  {
    question: "Что делать, если при git pull возникает конфликт?",
    options: [
      "Выполнить git pull --force чтобы перезаписать конфликтующие файлы",
      "Удалить локальный репозиторий и клонировать заново",
      "Открыть конфликтующие файлы, найти маркеры <<<<<<<, выбрать нужный вариант, сохранить, затем git add и git commit",
      "Подождать пока коллега исправит конфликт на своей стороне",
    ],
    correctIndex: 2,
    explanation:
      "Конфликт при pull — это нормальная ситуация. Git помечает конфликтующие места маркерами (<<<<<<< HEAD, =======, >>>>>>> origin/main). Ты выбираешь нужный вариант (или объединяешь оба), убираешь маркеры, сохраняешь файл, делаешь git add и git commit — конфликт разрешён.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Получи изменения из удалённого репозитория",
  description:
    "Попробуй выполнить git pull в своём репозитории. Для наглядности: внеси изменение прямо на GitHub через веб-интерфейс, затем сделай git pull локально — увидишь как изменения появятся у тебя.",
  hint: "Открой свой репозиторий на github.com → нажми на файл README.md → иконка карандаша → добавь строку → Commit changes. Теперь локально: git pull origin main. Посмотри git log --oneline — увидишь новый коммит!",
  verificationSteps: [
    "Внёс изменение в репозиторий (через GitHub или другой способ)",
    "Выполнил git pull origin main",
    "Проверил git log --oneline — появился новый коммит",
    "Убедился что файл обновился локально",
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
              text="Пока ты пил кофе, коллега залил новые фичи на сервер. Нужно обновиться. Знакомься с git pull — командой для получения изменений от команды."
            />
            <NarrativeBox
              text="git pull — это на самом деле две команды в одной: git fetch (скачать изменения с сервера) + git merge (слить их с текущей веткой). Удобно для быстрой синхронизации."
            />
            <NarrativeBox
              text="Когда можно смело делать pull? Когда у тебя нет незакоммиченных изменений. Если они есть — сначала git stash или git commit, иначе Git предупредит о возможной потере данных."
            />
            <NarrativeBox
              text="Конфликты при pull — нормальная часть командной работы. Если ты и коллега изменили один файл — Git покажет конфликт. Не пугайся: просто открой файл, выбери нужный вариант и закоммить."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать git pull в действии!
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
            <NarrativeBox text="Смотри: коммит появляется на сервере, затем git pull подтягивает его в локальный репозиторий." />

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
                {vizStep === 0 ? "git pull origin main" : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=15-pull"
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
            <NarrativeBox text="Два вопроса про git pull — проверим понимание механизма!" />

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
            <NarrativeBox text="Симулируй командную работу: внеси изменение на сервере и подтяни его локально!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
