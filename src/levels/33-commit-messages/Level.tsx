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
  { text: "git log --oneline", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# ❌ Плохие сообщения:", type: "output" as const },
  { text: "a1b2c3d fix", type: "error" as const },
  { text: "b2c3d4e update", type: "error" as const },
  { text: "c3d4e5f WIP", type: "error" as const },
  { text: "d4e5f6g asdfgh", type: "error" as const },
  { text: "e5f6g7h changes", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "# ✅ Хорошие сообщения:", type: "output" as const },
  { text: "f6g7h8i feat: add user authentication via GitHub OAuth", type: "success" as const },
  { text: "g7h8i9j fix: prevent crash when user has no avatar", type: "success" as const },
  { text: "h8i9j0k docs: add API rate limiting section to README", type: "success" as const },
  { text: "i9j0k1l refactor: extract validation logic into separate module", type: "success" as const },
  { text: "j0k1l2m test: add integration tests for payment flow", type: "success" as const },
];

const terminalConventional = [
  { text: "# Формат Conventional Commits:", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# <тип>: <описание>", type: "output" as const },
  { text: "#", type: "output" as const },
  { text: "# Типы:", type: "output" as const },
  { text: "#   feat:     новая функциональность", type: "success" as const },
  { text: "#   fix:      исправление бага", type: "success" as const },
  { text: "#   docs:     изменения в документации", type: "success" as const },
  { text: "#   style:    форматирование, пробелы, точки с запятой", type: "success" as const },
  { text: "#   refactor: рефакторинг без изменения поведения", type: "success" as const },
  { text: "#   test:     добавление или изменение тестов", type: "success" as const },
  { text: "#   chore:    обновление зависимостей, настройка CI", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Примеры:", type: "output" as const },
  { text: 'git commit -m "feat: add dark mode toggle to settings page"', type: "command" as const },
  { text: '[main a1b2c3d] feat: add dark mode toggle to settings page', type: "success" as const },
  { text: "", type: "output" as const },
  { text: 'git commit -m "fix: resolve memory leak in WebSocket connection"', type: "command" as const },
  { text: '[main b2c3d4e] fix: resolve memory leak in WebSocket connection', type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "fix", branch: "main" },
  { id: "b2c3d4e", message: "update", branch: "main", parent: "a1b2c3d" },
  { id: "c3d4e5f", message: "WIP", branch: "main", parent: "b2c3d4e" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Перепишем историю с понятными сообщениями",
    narration: "Посмотри как меняется читаемость, когда сообщения коммитов описательные",
    addCommits: [
      { id: "d4e5f6g", message: "feat: add user login page", branch: "main", parent: "c3d4e5f" },
    ],
    moveHead: "main",
  },
  {
    command: 'git commit -m "fix: validate email before sending reset link"',
    narration: "Каждый коммит теперь отвечает на вопрос: что было сделано и зачем?",
    addCommits: [
      { id: "e5f6g7h", message: "fix: validate email before reset", branch: "main", parent: "d4e5f6g" },
    ],
    moveHead: "main",
  },
  {
    command: 'git commit -m "test: add unit tests for email validation"',
    narration: "Тип коммита (feat, fix, test) сразу говорит о характере изменений",
    addCommits: [
      { id: "f6g7h8i", message: "test: add email validation tests", branch: "main", parent: "e5f6g7h" },
    ],
    moveHead: "main",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Какое сообщение коммита лучше всего?",
    options: [
      "fix bug",
      "fix: prevent null pointer exception in user profile endpoint",
      "исправил баг",
      "updated code",
    ],
    correctIndex: 1,
    explanation:
      "Хорошее сообщение коммита указывает тип (fix), кратко описывает ЧТО было исправлено и ГДЕ. Остальные варианты слишком расплывчаты — через неделю невозможно понять, что именно было изменено.",
  },
  {
    question: "Какой тип коммита подходит для добавления новой кнопки в интерфейс?",
    options: [
      "fix: add new button",
      "feat: add new button",
      "style: add new button",
      "update: add new button",
    ],
    correctIndex: 1,
    explanation:
      "feat (feature) — это новая функциональность. fix — исправление бага. style — изменения форматирования (пробелы, отступы), не влияющие на логику. update — не является стандартным типом в Conventional Commits.",
  },
  {
    question: "Что НЕ нужно включать в заголовок коммита?",
    options: [
      "Тип изменения (feat, fix, docs)",
      "Краткое описание на английском",
      "Подробное описание на 5 абзацев с цитатами из ТЗ",
      "Область кода, если проект большой (feat(auth): ...)",
    ],
    correctIndex: 2,
    explanation:
      "Заголовок коммита должен быть коротким (до 50-72 символов). Подробные описания, если нужны, пишутся в теле коммита (body) — через пустую строку после заголовка. В заголовке — только суть.",
  },
  {
    question: "Почему важно писать коммиты в повелительном наклонении (\"add\", а не \"added\")?",
    options: [
      "Так красивее выглядит",
      "Это соглашение Git — коммит описывает, что он ДЕЛАЕТ с кодом при применении",
      "Это требование GitHub",
      "Нет разницы, это просто стиль",
    ],
    correctIndex: 1,
    explanation:
      "Git сам использует повелительное наклонение (\"Merge branch...\", \"Revert...\"). Коммит отвечает на вопрос: \"Если применить этот коммит, он...\" → \"add user auth\", а не \"added user auth\". Это общепринятое соглашение в open source.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Напиши 3 правильных коммита",
  description:
    "Открой свой проект, внеси три небольших изменения и сделай три коммита, следуя Conventional Commits. Каждый коммит должен иметь правильный тип и описательное сообщение.",
  hint: "Примеры: git commit -m \"feat: add footer with contact links\" / git commit -m \"fix: correct typo in homepage title\" / git commit -m \"docs: add installation instructions to README\"",
  verificationSteps: [
    "Сделал коммит с типом feat: (новая функциональность)",
    "Сделал коммит с типом fix: или docs: (другой тип)",
    "Сделал коммит с типом на выбор (refactor, test, style, chore)",
    "Все сообщения на английском в повелительном наклонении",
    "Каждое сообщение до 72 символов",
    "Проверил историю: git log --oneline — все читаемо",
  ],
};

interface LevelProps {
  onComplete: (quizCorrect: number, quizTotal: number) => void;
}

export default function Level({ onComplete }: LevelProps) {
  const [currentStep, setCurrentStep] = useState<Step>("narrative");
  const [vizStep, setVizStep] = useState(0);
  const [quizScore, setQuizScore] = useState<{
    correct: number;
    total: number;
  } | null>(null);

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
            <NarrativeBox text="Знаешь, что отличает джуна от мидла? Не сложность кода, а умение писать историю проекта. И главный инструмент — это сообщения коммитов." />

            <NarrativeBox text="Представь: через 3 месяца в проде баг. Ты открываешь git log и видишь: 'fix', 'update', 'WIP', 'asdfgh'. Удачи найти, где сломалось! А теперь представь: 'fix: prevent null pointer in payment callback'. Сразу ясно, что к чему." />

            <NarrativeBox text="Есть общепринятый стандарт — Conventional Commits. Формат простой: тип: описание. Тип говорит ЧТО это (фича, фикс, рефакторинг), описание — конкретно ЧТО сделано." />

            <NarrativeBox text="Главные правила: 1) Пиши на английском — это стандарт в индустрии. 2) Используй повелительное наклонение: 'add', не 'added'. 3) Заголовок до 72 символов. 4) Отвечай на вопрос: если применить этот коммит, он..." />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Покажи примеры!
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
            <NarrativeBox text="Сначала посмотри разницу между плохими и хорошими сообщениями. Затем разберём формат Conventional Commits." />

            <TerminalSim lines={terminalLines} typingSpeed={15} />

            <NarrativeBox text="А вот полный список типов и примеры использования:" />

            <TerminalSim lines={terminalConventional} typingSpeed={15} />

            <div className="h-[420px]">
              <GitVisualizer
                initial={initialCommits}
                steps={visualizerSteps}
                currentStep={vizStep}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setVizStep(Math.min(vizStep + 1, visualizerSteps.length))
                }
                disabled={vizStep >= visualizerSteps.length}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {vizStep === 0
                  ? "feat: коммит"
                  : vizStep === 1
                  ? "fix: коммит"
                  : vizStep === 2
                  ? "test: коммит"
                  : "Все добавлены"}
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
            <NarrativeBox text="Четыре вопроса — проверим, насколько ты усвоил правила хороших коммит-сообщений." />

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
            <NarrativeBox text="Теория усвоена — пора практиковаться! Сделай три коммита с правильными сообщениями. Это навык, который окупится тысячи раз в твоей карьере." />

            <Challenge
              task={challengeTask}
              onComplete={handleChallengeComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
