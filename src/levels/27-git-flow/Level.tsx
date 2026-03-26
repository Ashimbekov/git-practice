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
  { text: "# Настройка Git Flow структуры", type: "output" as const },
  { text: "git switch -c develop", type: "command" as const },
  { text: "Switched to a new branch 'develop'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Начинаем новую фичу", type: "output" as const },
  { text: "git switch -c feature/user-auth develop", type: "command" as const },
  { text: "Switched to a new branch 'feature/user-auth'", type: "success" as const },
  { text: "# ... работаем над фичей ...", type: "output" as const },
  { text: "git switch develop && git merge feature/user-auth", type: "command" as const },
  { text: "Merge made by the 'ort' strategy.", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Готовим релиз", type: "output" as const },
  { text: "git switch -c release/1.0.0 develop", type: "command" as const },
  { text: "Switched to a new branch 'release/1.0.0'", type: "success" as const },
  { text: "# Финальные правки, bump version...", type: "output" as const },
  { text: "git switch main && git merge release/1.0.0", type: "command" as const },
  { text: "Merge made by the 'ort' strategy.", type: "success" as const },
  { text: "git tag -a v1.0.0 -m 'Release version 1.0.0'", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# Срочный баг в продакшне!", type: "output" as const },
  { text: "git switch -c hotfix/critical-bug main", type: "command" as const },
  { text: "Switched to a new branch 'hotfix/critical-bug'", type: "success" as const },
  { text: "# Исправляем баг...", type: "output" as const },
  { text: "git switch main && git merge hotfix/critical-bug", type: "command" as const },
  { text: "git switch develop && git merge hotfix/critical-bug", type: "command" as const },
  { text: "# Баг исправлен в обоих местах!", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Git Flow: main + develop — основа модели",
    narration: "Git Flow строится на двух постоянных ветках: main (всегда стабильный продакшн-код) и develop (интеграционная ветка для фич). Всё остальное — временные ветки.",
    addBranches: [
      { name: "main", commitId: "a1b2c3d", color: "#3b82f6" },
      { name: "develop", commitId: "a1b2c3d", color: "#8b5cf6" },
    ],
    moveHead: "develop",
    highlight: "a1b2c3d",
  },
  {
    command: "git switch -c feature/user-auth develop",
    narration: "Feature-ветки создаются от develop и сливаются обратно в develop. Они существуют только во время разработки фичи. Имя: feature/<описание>.",
    addCommits: [
      { id: "b2c3d4e", message: "feat: add auth module", branch: "feature/user-auth", parent: "a1b2c3d" },
    ],
    addBranches: [{ name: "feature/user-auth", commitId: "b2c3d4e", color: "#10b981" }],
    moveHead: "feature/user-auth",
    highlight: "b2c3d4e",
  },
  {
    command: "git switch develop && git merge feature/user-auth",
    narration: "Готовая фича вливается в develop. Теперь develop содержит новый функционал и готов к следующему релизу.",
    addCommits: [
      { id: "c3d4e5f", message: "Merge feature/user-auth into develop", branch: "develop", parent: "a1b2c3d", secondParent: "b2c3d4e" },
    ],
    addBranches: [{ name: "develop", commitId: "c3d4e5f", color: "#8b5cf6" }],
    moveHead: "develop",
    highlight: "c3d4e5f",
  },
  {
    command: "git switch -c release/1.0.0 develop",
    narration: "Release-ветка — подготовка к релизу. Создаётся от develop, содержит только финальные правки (версия, мелкие баги). Никаких новых фич! По завершению сливается в main И develop.",
    addCommits: [
      { id: "d3e4f5g", message: "chore: bump version to 1.0.0", branch: "release/1.0.0", parent: "c3d4e5f" },
    ],
    addBranches: [{ name: "release/1.0.0", commitId: "d3e4f5g", color: "#f59e0b" }],
    moveHead: "release/1.0.0",
    highlight: "d3e4f5g",
  },
  {
    command: "git merge release/1.0.0 → main + tag v1.0.0",
    narration: "Релиз влит в main и помечен тегом. main теперь указывает на v1.0.0. Hotfix-ветки создаются прямо от main когда нужно срочно исправить баг в продакшне.",
    addCommits: [
      { id: "e4f5g6h", message: "v1.0.0 release", branch: "main", parent: "a1b2c3d", secondParent: "d3e4f5g" },
    ],
    addBranches: [{ name: "main", commitId: "e4f5g6h", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "e4f5g6h",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "От какой ветки создаются feature-ветки в Git Flow?",
    options: [
      "От main — чтобы всегда иметь стабильную базу",
      "От develop — это интеграционная ветка для фич",
      "От release — чтобы сразу готовить к релизу",
      "Неважно, можно от любой",
    ],
    correctIndex: 1,
    explanation:
      "В Git Flow feature-ветки создаются от develop и сливаются обратно в develop. Ветка develop — это 'нестабильная' копия main, куда интегрируются все новые фичи до релиза.",
  },
  {
    question: "Зачем в Git Flow нужна hotfix-ветка?",
    options: [
      "Для разработки срочных фич по запросу заказчика",
      "Для тестирования перед релизом",
      "Для срочного исправления критических багов прямо в продакшне (от main)",
      "Для синхронизации main и develop",
    ],
    correctIndex: 2,
    explanation:
      "Hotfix-ветка создаётся прямо от main для срочного исправления критического бага в продакшне. После исправления она сливается и в main (чтобы баг ушёл из продакшна), и в develop (чтобы фикс не потерялся в следующем релизе).",
  },
];

const challengeTask: ChallengeTask = {
  title: "Настрой Git Flow структуру",
  description:
    "Создай репозиторий с полноценной Git Flow структурой: ветки main и develop, затем создай feature-ветку, сделай на ней коммит и влей в develop.",
  hint: "git init → git commit (initial) → git switch -c develop → git switch -c feature/my-feature develop → сделай коммит → git switch develop → git merge feature/my-feature. Проверь git log --oneline --graph --all.",
  verificationSteps: [
    "Создал репозиторий с начальным коммитом на main",
    "Создал ветку develop от main",
    "Создал feature-ветку от develop (feature/...)",
    "Сделал минимум один коммит на feature-ветке",
    "Слил feature-ветку обратно в develop",
    "Проверил структуру через git log --oneline --graph --all",
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
              text="Команда растёт — нужно договориться, как работать с ветками. Git Flow — одна из самых популярных моделей ветвления, предложенная Винсентом Дриссеном в 2010 году."
            />
            <NarrativeBox
              text="В основе Git Flow — две постоянные ветки. main: только стабильный, готовый к продакшну код. Каждый коммит здесь — это релиз. develop: интеграционная ветка, куда вливаются готовые фичи. Здесь может быть нестабильный код."
            />
            <NarrativeBox
              text="Временные ветки: feature/* — новая функциональность (от develop, в develop). release/* — подготовка к релизу: финальные правки, bump версии (от develop, в main+develop). hotfix/* — срочный фикс в продакшне (от main, в main+develop)."
            />
            <NarrativeBox
              text="Git Flow хорошо подходит для продуктов с чёткими версиями и регулярными релизами. Но для проектов с непрерывным деплоем (CI/CD) он может быть избыточно сложным — тогда смотрят в сторону trunk-based development."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать модель на графе!
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
            <NarrativeBox text="Построим Git Flow структуру шаг за шагом. Обрати внимание на цвета веток: синий — main, фиолетовый — develop, зелёный — feature, жёлтый — release." />

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
                  ? "Создать feature-ветку"
                  : vizStep === 1
                  ? "Влить фичу в develop"
                  : vizStep === 2
                  ? "Создать release-ветку"
                  : vizStep === 3
                  ? "Релиз в main + тег"
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
            <NarrativeBox text="Два вопроса про Git Flow. Главное — понять роль каждого типа веток и когда их использовать." />

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
            <NarrativeBox text="Построй Git Flow с нуля! Создай правильную структуру веток и пройди полный цикл разработки фичи по модели Git Flow." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
