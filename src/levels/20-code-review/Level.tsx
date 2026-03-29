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
  { text: "# Code review происходит на GitHub (веб-интерфейс)", type: "output" as const },
  { text: "# PR #12: feat: add user authentication", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Reviewer изучает изменения во вкладке 'Files changed'", type: "output" as const },
  { text: "# Нажимает на строку кода — появляется поле для комментария", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Комментарий 1 (общий вопрос):", type: "output" as const },
  { text: "# > Почему используешь bcrypt rounds=8?", type: "output" as const },
  { text: "# > Рекомендуется минимум 10-12 для продакшна.", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Комментарий 2 (конкретная строка):", type: "output" as const },
  { text: "# > const token = jwt.sign(user, SECRET)", type: "output" as const },
  { text: "# > SECRET нужно брать из process.env, не хардкодить!", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Автор PR отвечает на комментарии и пушит фикс:", type: "output" as const },
  { text: "git commit -m 'fix: address review comments - use env for secrets'", type: "command" as const },
  { text: "[feature/auth e7f8a9b] fix: address review comments", type: "success" as const },
  { text: "git push origin feature/auth", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# Reviewer видит новый коммит, проверяет фикс", type: "output" as const },
  { text: "# Нажимает 'Approve' + 'Submit review'", type: "output" as const },
  { text: "# ✓ Approved — PR готов к слиянию!", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add user model", branch: "main", parent: "a1b2c3d" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# PR открыт: feature/auth → main",
    narration: "PR создан: ветка feature/auth с двумя коммитами ждёт review. Reviewer получил уведомление и открыл вкладку 'Files changed'.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "feature/auth", commitId: "b2c3d4e", color: "#10b981" },
    ],
    addCommits: [
      { id: "c3d4e5f", message: "feat: add auth logic", branch: "feature/auth", parent: "b2c3d4e" },
      { id: "d4e5f6g", message: "feat: add login endpoint", branch: "feature/auth", parent: "c3d4e5f" },
    ],
    moveHead: "feature/auth",
    highlight: "d4e5f6g",
  },
  {
    command: "# Reviewer: 'Request changes' — нужны правки",
    narration: "Reviewer нашёл проблему с SECRET и попросил изменения ('Request changes'). PR заблокирован до исправления. Это нормально — цель review помочь, а не критиковать.",
    addBranches: [
      { name: "main", commitId: "b2c3d4e", color: "#3b82f6" },
      { name: "feature/auth", commitId: "d4e5f6g", color: "#10b981" },
    ],
    moveHead: "feature/auth",
    highlight: "d4e5f6g",
  },
  {
    command: "git commit -m 'fix: address review comments'",
    narration: "Автор исправил замечания и добавил новый коммит. Reviewer видит изменения, убеждается что всё исправлено, нажимает 'Approve'. PR готов к мёржу!",
    addCommits: [
      { id: "e5f6g7h", message: "fix: address review comments", branch: "feature/auth", parent: "d4e5f6g" },
    ],
    addBranches: [
      { name: "feature/auth", commitId: "e5f6g7h", color: "#10b981" },
      { name: "main", commitId: "e5f6g7h", color: "#3b82f6" },
    ],
    moveHead: "main",
    highlight: "e5f6g7h",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что означает 'Request changes' в GitHub code review?",
    options: [
      "Reviewer просит автора добавить новые фичи в PR",
      "Reviewer блокирует PR и требует исправлений до одобрения",
      "PR автоматически закрывается и нужно создавать новый",
      "Reviewer запрашивает доступ к репозиторию автора",
    ],
    correctIndex: 1,
    explanation:
      "'Request changes' — это формальный сигнал: reviewer нашёл проблемы, которые нужно исправить до мёржа. PR получает статус 'Changes requested' и не может быть слит, пока reviewer не одобрит исправления. Автор пушит новые коммиты с фиксами прямо в ту же ветку — PR обновляется автоматически.",
  },
  {
    question: "Какой главный принцип хорошего code review?",
    options: [
      "Найти как можно больше ошибок, чтобы показать свою компетентность",
      "Одобрять PR как можно быстрее, чтобы не задерживать команду",
      "Комментировать код, а не автора — критика должна быть конструктивной и помогать улучшить код",
      "Проверять только синтаксис и форматирование кода",
    ],
    correctIndex: 2,
    explanation:
      "Хороший code review — это сотрудничество, не соревнование. Правила: 1) Критикуй код, не человека ('эта функция делает слишком много' вместо 'ты написал плохой код')  2) Объясняй почему, а не только что  3) Предлагай решение, если видишь проблему  4) Отмечай хорошее, не только плохое  5) Задавай вопросы вместо утверждений ('Что если...?' вместо 'Это неправильно')",
  },
];

const challengeTask: ChallengeTask = {
  title: "Проведи code review или опиши процесс",
  description:
    "Если у тебя есть коллега или друг с GitHub: попроси его создать PR в твой репозиторий и проведи настоящий review. Если нет — создай PR сам в своём репозитории и оставь хотя бы один комментарий к коду.",
  hint: "Как оставить комментарий в PR: открой PR на GitHub → вкладка 'Files changed' → наведи на строку кода → нажми синий '+' → напиши комментарий → 'Start a review'. В конце нажми 'Review changes' → выбери 'Comment', 'Approve' или 'Request changes'.",
  verificationSteps: [
    "Открыл PR на GitHub (свой или чужой)",
    "Перешёл на вкладку 'Files changed' и изучил изменения",
    "Оставил хотя бы один комментарий к конкретной строке кода",
    "Комментарий конструктивен: объясняет проблему или предлагает улучшение",
    "Завершил review: нажал 'Review changes' и выбрал тип (Comment/Approve/Request changes)",
    "Понял разницу между Comment, Approve и Request changes",
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
              text="Pull Request без code review — как документ без проверки. Code review — это процесс, при котором другой разработчик изучает твои изменения до их слияния. Это одна из самых ценных практик в разработке."
            />
            <NarrativeBox
              text="На GitHub reviewer открывает PR, переходит во вкладку 'Files changed' и видит все изменения. Можно оставлять комментарии к конкретным строкам, задавать вопросы, предлагать улучшения."
            />
            <NarrativeBox
              text="Три типа review: Comment — просто комментарий без блокировки; Approve — всё хорошо, можно мёржить; Request changes — есть проблемы, нужно исправить. Merge невозможен, пока есть 'Request changes'."
            />
            <NarrativeBox
              text="Лучшие практики reviewer: 1) Понять цель изменений до чтения кода  2) Проверить логику, не только стиль  3) Оставлять конструктивные комментарии с объяснением  4) Не задерживать review дольше суток  5) Помнить: ты помогаешь, а не осуждаешь."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Посмотреть review в деле!
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
            <NarrativeBox text="Смотри на полный цикл: PR → комментарии → исправления → approve → merge." />

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
                  ? "Request changes"
                  : vizStep === 1
                  ? "Исправить и Approve"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=20-code-review"
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
            <NarrativeBox text="Проверим ключевые принципы code review — механику и культуру." />

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
            <NarrativeBox text="Попробуй провести настоящий code review! Даже один конструктивный комментарий — это большая практика." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
