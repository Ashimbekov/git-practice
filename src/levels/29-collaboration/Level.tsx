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
  { text: "# Конвенция именования веток", type: "output" as const },
  { text: "# feat/<короткое-описание>  — новая функциональность", type: "output" as const },
  { text: "# fix/<issue-id>-description — исправление бага", type: "output" as const },
  { text: "# chore/<задача>            — инфраструктура, зависимости", type: "output" as const },
  { text: "git switch -c feat/user-profile-page", type: "command" as const },
  { text: "Switched to a new branch 'feat/user-profile-page'", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Conventional Commits: тип(scope): описание", type: "output" as const },
  { text: "git commit -m 'feat(profile): add avatar upload component'", type: "command" as const },
  { text: "[feat/user-profile-page a1b2c3] feat(profile): add avatar upload component", type: "success" as const },
  { text: "git commit -m 'fix(auth): handle expired token edge case'", type: "command" as const },
  { text: "[feat/user-profile-page b2c3d4] fix(auth): handle expired token edge case", type: "success" as const },
  { text: "git commit -m 'docs: update API reference for profile endpoint'", type: "command" as const },
  { text: "[feat/user-profile-page c3d4e5] docs: update API reference for profile endpoint", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Настройка .gitignore", type: "output" as const },
  { text: "cat .gitignore", type: "command" as const },
  { text: "node_modules/", type: "output" as const },
  { text: ".env", type: "output" as const },
  { text: ".env.local", type: "output" as const },
  { text: "dist/", type: "output" as const },
  { text: ".DS_Store", type: "output" as const },
  { text: "*.log", type: "output" as const },
  { text: "coverage/", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Проверяем что секреты не попали в индекс", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch feat/user-profile-page", type: "output" as const },
  { text: "nothing to commit, working tree clean", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: project scaffold", branch: "main", parent: undefined },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Старт: main с хорошо названными коммитами",
    narration: "В хорошей команде история коммитов читается как документация. Каждый коммит отвечает на вопрос: 'что изменено и зачем?' Это упрощает git log, git bisect и code review.",
    addBranches: [
      { name: "main", commitId: "a1b2c3d", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "a1b2c3d",
  },
  {
    command: "git switch -c feat/user-profile-page",
    narration: "Ветка называется feat/user-profile-page — сразу понятно: это feature, связанная со страницей профиля. Соглашение об именах помогает команде ориентироваться без лишних вопросов.",
    addCommits: [
      { id: "b2c3d4e", message: "feat(profile): add avatar upload", branch: "feat/user-profile-page", parent: "a1b2c3d" },
    ],
    addBranches: [{ name: "feat/user-profile-page", commitId: "b2c3d4e", color: "#10b981" }],
    moveHead: "feat/user-profile-page",
    highlight: "b2c3d4e",
  },
  {
    command: "git commit -m 'fix(auth): handle expired token'",
    narration: "Conventional Commits: тип(scope): описание. Типы: feat, fix, docs, chore, refactor, test, style. Scope — необязательный контекст (модуль, компонент). Это позволяет автоматически генерировать changelog.",
    addCommits: [
      { id: "c3d4e5f", message: "fix(auth): handle expired token", branch: "feat/user-profile-page", parent: "b2c3d4e" },
    ],
    addBranches: [{ name: "feat/user-profile-page", commitId: "c3d4e5f", color: "#10b981" }],
    moveHead: "feat/user-profile-page",
    highlight: "c3d4e5f",
  },
  {
    command: "git merge feat/user-profile-page → main",
    narration: "Готовая ветка с понятной историей вливается в main. Reviewer'ам легко: каждый коммит атомарный и описателен. git log --oneline на main читается как журнал разработки.",
    addCommits: [
      {
        id: "d3e4f5g",
        message: "Merge feat/user-profile-page",
        branch: "main",
        parent: "a1b2c3d",
        secondParent: "c3d4e5f",
      },
    ],
    addBranches: [{ name: "main", commitId: "d3e4f5g", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "d3e4f5g",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Какой формат Conventional Commits правильный?",
    options: [
      "ADDED: new user profile component",
      "feat(profile): add user profile component",
      "feature - added user profile component",
      "update profile.tsx",
    ],
    correctIndex: 1,
    explanation:
      "Conventional Commits формат: тип(scope): описание. Тип — обязателен (feat, fix, docs, chore, etc). Scope — необязателен, указывает модуль. Описание — краткое, в настоящем времени, строчными буквами. Это позволяет инструментам автоматически создавать changelog и определять версию (semver).",
  },
  {
    question: "Что НЕЛЬЗЯ добавлять в git репозиторий и нужно прописать в .gitignore?",
    options: [
      "Файлы README.md и документацию",
      "Конфигурационные файлы типа tsconfig.json",
      "Файлы .env с секретами, node_modules/, папки сборки dist/build/",
      "Тесты и файлы с моками",
    ],
    correctIndex: 2,
    explanation:
      "В .gitignore обязательно добавляй: .env и все файлы с секретами (пароли, API ключи), node_modules/ (устанавливается через npm install), папки сборки dist/build/ (генерируются автоматически), .DS_Store (мусор macOS), *.log файлы. Секреты в репозитории — серьёзная уязвимость безопасности.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Настрой проект по всем правилам",
  description:
    "Создай репозиторий с правильным .gitignore, сделай несколько коммитов в формате Conventional Commits и создай feature-ветку с осмысленным именем.",
  hint: "1) git init. 2) Создай .gitignore с node_modules/, .env, dist/, .DS_Store. 3) git add .gitignore && git commit -m 'chore: add .gitignore'. 4) git switch -c feat/add-homepage. 5) Создай index.html, git add, git commit -m 'feat(homepage): add main page layout'. 6) Ещё один коммит: fix или docs. 7) git switch main && git merge feat/add-homepage.",
  verificationSteps: [
    "Создал репозиторий (git init)",
    "Создал .gitignore с минимум 4 правилами (node_modules/, .env, dist/, .DS_Store)",
    "Сделал коммит с правильным Conventional Commits форматом для .gitignore",
    "Создал feature-ветку с осмысленным именем (feat/...)",
    "Сделал минимум 2 коммита в Conventional Commits формате",
    "Слил feature-ветку в main",
    "Проверил git log --oneline — история читается понятно",
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
              text="Ты уже знаешь команды Git. Но хорошая командная работа — это ещё и договорённости: как называть ветки, как писать коммиты и что никогда не должно попасть в репозиторий."
            />
            <NarrativeBox
              text="Conventional Commits — стандарт написания сообщений коммитов. Формат: тип(scope): описание. Типы: feat (новая функция), fix (исправление), docs (документация), chore (инфраструктура), refactor, test, style. Пример: feat(auth): add OAuth2 login."
            />
            <NarrativeBox
              text="Именование веток: используй префиксы. feat/user-profile — новая фича. fix/123-login-bug — исправление бага (можно с номером задачи). chore/update-dependencies — обновление зависимостей. release/1.2.0, hotfix/critical-crash. Коллеги сразу понимают контекст без слов."
            />
            <NarrativeBox
              text=".gitignore — список файлов, которые Git должен игнорировать. Обязательно: node_modules/ (тяжёлые зависимости), .env и .env.local (секреты, пароли, API ключи), dist/ и build/ (собранный код), .DS_Store (мусор macOS), *.log. Секреты в репозитории — это дыра в безопасности!"
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Посмотреть в действии!
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
            <NarrativeBox text="Смотри на разницу: коммиты с осмысленными сообщениями превращают git log в читаемую историю проекта, а не набор непонятных записей." />

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
                  ? "Conventional Commit"
                  : vizStep === 2
                  ? "Влить в main"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=29-collaboration"
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
            <NarrativeBox text="Два вопроса про командные практики. Хорошие конвенции экономят часы при code review и поиске багов через git log." />

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
            <NarrativeBox text="Настрой проект как профессионал: .gitignore с защитой секретов, осмысленные имена веток, коммиты в Conventional Commits формате. Это навыки на каждый день!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
