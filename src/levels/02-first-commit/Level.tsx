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
  { text: "echo '# My Project' > README.md", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch main", type: "output" as const },
  { text: "Untracked files:", type: "output" as const },
  { text: "  (use \"git add <file>...\" to include in what will be committed)", type: "output" as const },
  { text: "        README.md", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "git add README.md", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch main", type: "output" as const },
  { text: "Changes to be committed:", type: "success" as const },
  { text: "  (use \"git rm --cached <file>...\" to unstage)", type: "output" as const },
  { text: "        new file:   README.md", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "git commit -m \"Initial commit: add README\"", type: "command" as const },
  { text: "[main (root-commit) a1b2c3d] Initial commit: add README", type: "success" as const },
  { text: " 1 file changed, 1 insertion(+)", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "git add README.md",
    narration: "Файл README.md добавлен в staging area (индекс). Git теперь отслеживает его, но коммит ещё не создан.",
    addBranches: [{ name: "main", commitId: "", color: "#3b82f6" }],
    moveHead: "main",
  },
  {
    command: "git commit -m \"Initial commit: add README\"",
    narration: "Первый коммит создан! Git сохранил снимок файлов из staging area. Ветка main теперь указывает на этот коммит.",
    addCommits: [{ id: "a1b2c3d", message: "Initial commit: add README", branch: "main" }],
    addBranches: [{ name: "main", commitId: "a1b2c3d", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "a1b2c3d",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что делает команда git add?",
    options: [
      "Создаёт новый файл в проекте",
      "Добавляет файл в staging area (индекс) для следующего коммита",
      "Отправляет файл на сервер GitHub",
      "Удаляет файл из репозитория",
    ],
    correctIndex: 1,
    explanation:
      "git add добавляет изменения в staging area (индекс). Это промежуточная зона — как коробка, в которую ты складываешь вещи перед тем, как запечатать и подписать (сделать коммит).",
  },
  {
    question: "Что делает команда git commit?",
    options: [
      "Загружает код на удалённый сервер",
      "Создаёт снимок (snapshot) всех изменений из staging area",
      "Откатывает последние изменения",
      "Показывает историю изменений",
    ],
    correctIndex: 1,
    explanation:
      "git commit фиксирует все изменения из staging area в историю репозитория. Каждый коммит — это снимок состояния проекта, к которому можно вернуться в любой момент.",
  },
  {
    question: "Для чего нужен флаг -m в команде git commit -m \"сообщение\"?",
    options: [
      "Для указания имени автора коммита",
      "Для указания ветки, в которую делается коммит",
      "Для написания сообщения коммита прямо в командной строке",
      "Для автоматического добавления всех файлов в коммит",
    ],
    correctIndex: 2,
    explanation:
      "Флаг -m позволяет написать сообщение коммита прямо в терминале. Без него Git откроет текстовый редактор для ввода сообщения. Хорошее сообщение коммита кратко описывает, что было изменено и зачем.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Сделай свой первый коммит",
  description:
    "Используя репозиторий, который ты создал в предыдущем уроке (или создай новый), добавь файл и сделай свой первый коммит. Почувствуй, как работает цикл: создание файла → git add → git commit.",
  hint: 'Создай файл: echo "Hello Git!" > hello.txt. Затем добавь его: git add hello.txt. И сделай коммит: git commit -m "My first commit". Проверь результат: git log',
  verificationSteps: [
    "Создал новый файл в репозитории",
    "Выполнил git add для этого файла",
    "Выполнил git status и увидел файл в staging area (зелёным)",
    "Сделал коммит с помощью git commit -m",
    "Проверил историю через git log и увидел свой коммит",
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
              text="С возвращением! В прошлый раз мы создали репозиторий — наш «пустой фотоальбом». Сегодня научимся делать первые «снимки» — коммиты."
            />
            <NarrativeBox
              text="В Git есть два шага перед сохранением. Первый — git add. Представь, что ты складываешь вещи в коробку. Ты выбираешь, какие файлы войдут в следующий коммит, и кладёшь их в «staging area» — зону подготовки."
            />
            <NarrativeBox
              text="Второй шаг — git commit. Это как запечатать коробку и наклеить на неё этикетку с описанием содержимого. После коммита все изменения из staging area сохраняются в историю. Навсегда."
            />
            <NarrativeBox
              text="Зачем два шага? Потому что иногда ты меняешь 10 файлов, но хочешь зафиксировать только 3 из них. git add даёт тебе полный контроль над тем, что попадёт в коммит."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Понятно, покажи на примере!
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
            <NarrativeBox text="Смотри, как это работает пошагово. Сначала создаём файл, добавляем в staging area, а потом делаем коммит." />

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
                {vizStep === 0 ? "git add" : vizStep === 1 ? "git commit" : "Готово"}
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
            <NarrativeBox text="Время проверки! Три вопроса — посмотрим, насколько хорошо ты разобрался в git add и git commit." />

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
            <NarrativeBox text="Отлично! Теперь самое важное — практика. Открой терминал и сделай свой первый коммит. Это навык, который ты будешь использовать каждый день!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
