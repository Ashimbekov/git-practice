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
  { text: "# Trunk-Based: короткая ветка → быстрый PR → merge в main", type: "output" as const },
  { text: "git switch main && git pull origin main", type: "command" as const },
  { text: "Already up to date.", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Создаём короткоживущую ветку (на 1-2 дня максимум)", type: "output" as const },
  { text: "git switch -c feat/add-search-bar", type: "command" as const },
  { text: "Switched to a new branch 'feat/add-search-bar'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Работаем, прячем незаконченное за feature flag", type: "output" as const },
  { text: "# if (featureFlags.searchBar) { <SearchBar /> }", type: "output" as const },
  { text: "git add . && git commit -m 'feat: add search bar behind feature flag'", type: "command" as const },
  { text: "[feat/add-search-bar a1b2c3d] feat: add search bar behind feature flag", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Сразу создаём PR и сливаем в main после ревью", type: "output" as const },
  { text: "git switch main && git merge feat/add-search-bar", type: "command" as const },
  { text: "Updating b2c3d4e..a1b2c3d", type: "output" as const },
  { text: "Fast-forward", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# CI/CD автоматически деплоит main в продакшн", type: "output" as const },
  { text: "# Feature flag выключен — пользователи не видят незаконченное", type: "success" as const },
  { text: "git branch -d feat/add-search-bar", type: "command" as const },
  { text: "Deleted branch feat/add-search-bar.", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial setup", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add homepage", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Trunk-Based: main — единственная долгоживущая ветка",
    narration: "В trunk-based development ветка main (trunk) — это единственная долгоживущая ветка. Все разработчики интегрируют свои изменения в неё как можно чаще — желательно каждый день.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "git switch -c feat/add-search-bar (живёт 1-2 дня)",
    narration: "Ветки в trunk-based существуют минимальное время — от нескольких часов до пары дней. Цель: быстрая интеграция. Чем дольше ветка живёт отдельно, тем сложнее потом слияние.",
    addCommits: [
      { id: "c3d4e5f", message: "feat: search bar (behind flag)", branch: "feat/add-search-bar", parent: "b2c3d4e" },
    ],
    addBranches: [{ name: "feat/add-search-bar", commitId: "c3d4e5f", color: "#10b981" }],
    moveHead: "feat/add-search-bar",
    highlight: "c3d4e5f",
  },
  {
    command: "git merge feat/add-search-bar → main (fast-forward)",
    narration: "Ветка сразу вливается в main. Незаконченная функциональность спрятана за feature flag — в коде она есть, но выключена для пользователей. CI/CD автоматически деплоит main.",
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
  {
    command: "# Следующий разработчик — снова от актуального main",
    narration: "Второй разработчик тоже создаёт короткую ветку от свежего main. История остаётся почти линейной. Конфликты минимальны, потому что все постоянно интегрируют свои изменения.",
    addCommits: [
      { id: "d3e4f5g", message: "fix: button hover state", branch: "feat/fix-button", parent: "c3d4e5f" },
    ],
    addBranches: [{ name: "feat/fix-button", commitId: "d3e4f5g", color: "#f59e0b" }],
    moveHead: "feat/fix-button",
    highlight: "d3e4f5g",
  },
  {
    command: "git merge feat/fix-button → main (снова fast-forward)",
    narration: "История main растёт линейно. Сравни с Git Flow: там main — редкий снимок релизов. В trunk-based main — живой поток изменений, который всегда готов к деплою.",
    addBranches: [{ name: "main", commitId: "d3e4f5g", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "d3e4f5g",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Чем trunk-based development отличается от Git Flow?",
    options: [
      "В trunk-based нет веток вообще — все коммитят прямо в main",
      "В trunk-based ветки живут дни, а не недели; интеграция в main происходит постоянно",
      "Trunk-based используется только для open-source проектов",
      "В trunk-based нельзя использовать git merge",
    ],
    correctIndex: 1,
    explanation:
      "Главное отличие — частота интеграции. В Git Flow ветки могут жить неделями. В trunk-based — часы или максимум 1-2 дня. Все разработчики постоянно интегрируют изменения в main, что минимизирует конфликты и ускоряет CI/CD.",
  },
  {
    question: "Зачем нужны feature flags в trunk-based development?",
    options: [
      "Чтобы помечать коммиты с новыми фичами для отчётности",
      "Чтобы включать/выключать незаконченную функциональность без изменения кода в продакшне",
      "Это специальные git-теги для релизов",
      "Флаги нужны только для хотфиксов",
    ],
    correctIndex: 1,
    explanation:
      "Feature flags (feature toggles) позволяют влить незаконченный код в main, но спрятать его от пользователей. Код уже интегрирован, CI/CD работает, но функциональность видна только когда флаг включён. Это позволяет сохранять короткие ветки, не нарушая опыт пользователей.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Попрактикуй trunk-based workflow",
  description:
    "Симулируй trunk-based процесс: создай короткоживущую ветку, сделай один коммит и сразу влей в main. Повтори процесс три раза — покажи линейную историю main.",
  hint: "Три раза подряд: git switch main → git switch -c feat/feature-N → коммит → git switch main → git merge feat/feature-N → git branch -d feat/feature-N. В конце запусти git log --oneline -- посмотри на линейную историю!",
  verificationSteps: [
    "Создал репозиторий с начальным коммитом на main",
    "Первый цикл: ветка feat/feature-1 → коммит → merge в main → удалить ветку",
    "Второй цикл: ветка feat/feature-2 → коммит → merge в main → удалить ветку",
    "Третий цикл: ветка feat/feature-3 → коммит → merge в main → удалить ветку",
    "Проверил git log --oneline — история main линейная (fast-forward merges)",
    "Проверил git branch — нет лишних веток (только main)",
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
              text="Git Flow отлично работает для продуктов с версиями. Но что если ты деплоишь 10 раз в день? Представь: Google, Facebook, Netflix — они не ждут релизного окна раз в две недели."
            />
            <NarrativeBox
              text="Trunk-Based Development (TBD) — альтернативный подход. Главный принцип: все разработчики интегрируют изменения в одну общую ветку (trunk / main) как можно чаще. Ветки живут часы, максимум 1-2 дня — не недели."
            />
            <NarrativeBox
              text="Как справляться с незаконченными фичами? Feature flags! Код уже влит в main, CI/CD его деплоит, но функциональность спрятана за переключателем. Когда фича готова — включаешь флаг. Откатиться? Просто выключить флаг, не нужно git revert."
            />
            <NarrativeBox
              text="TBD vs Git Flow: TBD — непрерывная интеграция, меньше конфликтов, быстрый деплой, требует дисциплины и тестов. Git Flow — структурированные релизы, ясные этапы, подходит для версионированных продуктов. Нет универсального ответа — выбирай под контекст."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Сравним на графе!
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
            <NarrativeBox text="Заметь разницу: история main при trunk-based почти линейная. Короткие ветки создаются и сразу сливаются — без долгих расхождений." />

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
                  ? "Создать короткую ветку"
                  : vizStep === 1
                  ? "Быстро влить в main"
                  : vizStep === 2
                  ? "Второй разработчик"
                  : vizStep === 3
                  ? "Снова merge в main"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=28-trunk-based"
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
            <NarrativeBox text="Два вопроса про trunk-based development. Пойми ключевые идеи: частая интеграция и feature flags." />

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
            <NarrativeBox text="Почувствуй ритм trunk-based: быстрые циклы, линейная история, никаких долгоживущих веток. Три итерации — и ты поймёшь суть!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
