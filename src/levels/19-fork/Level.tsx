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
  { text: "# 1. Форкаем репозиторий на GitHub (кнопка Fork)", type: "output" as const },
  { text: "# Теперь у тебя есть копия: github.com/ты/project", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# 2. Клонируем СВОЙ форк (не оригинал!)", type: "output" as const },
  { text: "git clone https://github.com/ты/project.git", type: "command" as const },
  { text: "Cloning into 'project'...", type: "output" as const },
  { text: "remote: Enumerating objects: 142, done.", type: "output" as const },
  { text: "Resolving deltas: 100% (87/87), done.", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "cd project", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# 3. Добавляем upstream — оригинальный репозиторий", type: "output" as const },
  { text: "git remote add upstream https://github.com/автор/project.git", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "git remote -v", type: "command" as const },
  { text: "origin    https://github.com/ты/project.git (fetch)", type: "output" as const },
  { text: "origin    https://github.com/ты/project.git (push)", type: "output" as const },
  { text: "upstream  https://github.com/автор/project.git (fetch)", type: "output" as const },
  { text: "upstream  https://github.com/автор/project.git (push)", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# 4. Создаём ветку для своих изменений", type: "output" as const },
  { text: "git checkout -b fix/typo-in-readme", type: "command" as const },
  { text: "Switched to a new branch 'fix/typo-in-readme'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# 5. Делаем изменения, коммитим, пушим в СВОЙ форк", type: "output" as const },
  { text: "git push origin fix/typo-in-readme", type: "command" as const },
  { text: " * [new branch]  fix/typo-in-readme -> fix/typo-in-readme", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# 6. На GitHub создаём PR из нашего форка в оригинал", type: "output" as const },
  { text: "# Автор проверит и примет (или не примет) изменения", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add readme", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Fork: копируем репозиторий в свой аккаунт",
    narration: "Fork создаёт полную копию репозитория в твоём GitHub аккаунте. У тебя есть свой 'origin' (твой форк), и 'upstream' — оригинальный репозиторий.",
    addBranches: [
      { name: "upstream/main", commitId: "b2c3d4e", color: "#f59e0b" },
      { name: "origin/main", commitId: "b2c3d4e", color: "#3b82f6" },
    ],
    moveHead: "origin/main",
    highlight: "b2c3d4e",
  },
  {
    command: "git checkout -b fix/typo-in-readme",
    narration: "Создаём ветку в своём форке. Никогда не работай напрямую в main — это хорошая практика как для форков, так и для обычной работы.",
    addBranches: [
      { name: "upstream/main", commitId: "b2c3d4e", color: "#f59e0b" },
      { name: "origin/main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "fix/typo-in-readme", commitId: "b2c3d4e", color: "#10b981" },
    ],
    moveHead: "fix/typo-in-readme",
    highlight: "b2c3d4e",
  },
  {
    command: "git commit + PR to upstream",
    narration: "Коммит в своей ветке → push в свой форк → PR в оригинальный репозиторий (upstream). Автор проверит изменения и примет их. Так работает весь open source!",
    addCommits: [
      { id: "c3d4e5f", message: "fix: typo in readme", branch: "fix/typo-in-readme", parent: "b2c3d4e" },
    ],
    addBranches: [
      { name: "fix/typo-in-readme", commitId: "c3d4e5f", color: "#10b981" },
      { name: "upstream/main", commitId: "c3d4e5f", color: "#f59e0b" },
    ],
    moveHead: "upstream/main",
    highlight: "c3d4e5f",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "В чём разница между origin и upstream при работе с форком?",
    options: [
      "origin и upstream — это одно и то же, просто разные названия",
      "origin — твой форк на GitHub, upstream — оригинальный репозиторий проекта",
      "origin — локальная копия, upstream — твой форк на GitHub",
      "upstream — более старая версия репозитория, origin — новая",
    ],
    correctIndex: 1,
    explanation:
      "При работе с форком: origin — это твоя копия репозитория на GitHub (ты можешь туда пушить). upstream — оригинальный репозиторий автора проекта (туда ты пушить не можешь, только читать и отправлять PR). Команда: git remote add upstream [URL оригинала].",
  },
  {
    question: "Зачем нужно периодически делать git fetch upstream при работе с форком?",
    options: [
      "Это не нужно — форк автоматически синхронизируется с оригиналом",
      "Чтобы обновить свой форк новыми изменениями из оригинального репозитория и избежать конфликтов",
      "Чтобы удалить старые ветки из форка",
      "Это нужно только когда ты хочешь закрыть свой форк",
    ],
    correctIndex: 1,
    explanation:
      "Пока ты работаешь над форком, оригинальный репозиторий (upstream) продолжает обновляться. Если не синхронизировать — появятся конфликты. Правильный workflow: git fetch upstream → git merge upstream/main (или git rebase upstream/main) → работай с актуальным кодом. GitHub также предлагает кнопку 'Sync fork' в веб-интерфейсе.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Форкни репозиторий и настрой upstream",
  description:
    "Найди любой публичный репозиторий на GitHub (например, интересную библиотеку или учебный проект). Форкни его, склонируй свой форк и настрой upstream на оригинальный репозиторий.",
  hint: "1) На GitHub: найди репозиторий → кнопка Fork (вверху справа)  2) git clone https://github.com/ТЫ/РЕПО.git  3) cd РЕПО  4) git remote add upstream https://github.com/АВТОР/РЕПО.git  5) git remote -v — убедись что видишь оба remote",
  verificationSteps: [
    "Нашёл интересный публичный репозиторий на GitHub",
    "Нажал кнопку Fork — репозиторий появился в твоём аккаунте",
    "Склонировал свой форк (git clone https://github.com/ТЫ/...)",
    "Добавил upstream: git remote add upstream https://github.com/АВТОР/...",
    "Проверил git remote -v — видны оба remote (origin и upstream)",
    "Создал ветку для изменений (git checkout -b my-improvement)",
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
              text="Хочешь исправить баг в любимой библиотеке? Или добавить фичу в open source проект? Именно для этого существует Fork — один из самых мощных механизмов GitHub."
            />
            <NarrativeBox
              text="Fork создаёт полную копию чужого репозитория в твоём аккаунте. Ты можешь изменять её как угодно — оригинал никак не пострадает. А когда будешь готов — отправишь Pull Request автору."
            />
            <NarrativeBox
              text="Ключевые понятия: origin — твой форк (ты можешь туда пушить), upstream — оригинальный репозиторий (только для чтения и отправки PR). Это стандартная терминология в open source."
            />
            <NarrativeBox
              text="Так развивается весь open source: тысячи разработчиков форкают репозиторий, улучшают его у себя, и лучшие изменения принимаются в основной проект. React, Vue, Linux — всё работает так."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Посмотреть fork в деле!
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
            <NarrativeBox text="Смотри: форк создаёт твою копию, ты работаешь в ней, а PR отправляется обратно в оригинал." />

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
                  ? "Создать ветку в форке"
                  : vizStep === 1
                  ? "Отправить PR в upstream"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=19-fork"
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
            <NarrativeBox text="Проверим понимание ключевых концепций форка: origin vs upstream и зачем нужна синхронизация." />

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
            <NarrativeBox text="Время сделать настоящий форк! Это твой первый шаг к участию в open source." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
