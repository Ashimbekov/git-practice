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
  { text: "git log", type: "command" as const },
  { text: "commit d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3", type: "output" as const },
  { text: "Author: Alex Developer <alex@example.com>", type: "output" as const },
  { text: "Date:   Thu Mar 20 14:32:11 2025 +0600", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "    feat: add user authentication module", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "commit c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2", type: "output" as const },
  { text: "Author: Alex Developer <alex@example.com>", type: "output" as const },
  { text: "Date:   Wed Mar 19 10:15:44 2025 +0600", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "    fix: resolve login form validation bug", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "commit b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1", type: "output" as const },
  { text: "Author: Alex Developer <alex@example.com>", type: "output" as const },
  { text: "Date:   Tue Mar 18 09:05:22 2025 +0600", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "    chore: initial project setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Компактный вид — намного удобнее!", type: "output" as const },
  { text: "git log --oneline", type: "command" as const },
  { text: "d4e5f6a feat: add user authentication module", type: "success" as const },
  { text: "c3d4e5f fix: resolve login form validation bug", type: "success" as const },
  { text: "b2c3d4e chore: initial project setup", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Граф веток и слияний", type: "output" as const },
  { text: "git log --oneline --graph --all", type: "command" as const },
  { text: "* d4e5f6a (HEAD -> main) feat: add user authentication module", type: "success" as const },
  { text: "* c3d4e5f fix: resolve login form validation bug", type: "success" as const },
  { text: "* b2c3d4e chore: initial project setup", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "b2c3d4e", message: "chore: initial project setup", branch: "main" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "git commit -m \"fix: resolve login form validation bug\"",
    narration: "Второй коммит добавлен. История растёт — git log покажет оба коммита в обратном хронологическом порядке (новые сверху).",
    addCommits: [{ id: "c3d4e5f", message: "fix: resolve login form validation bug", branch: "main" }],
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
  {
    command: "git commit -m \"feat: add user authentication module\"",
    narration: "Третий коммит. Теперь история содержит три записи. git log --oneline покажет их в одну строку: хеш + сообщение.",
    addCommits: [{ id: "d4e5f6a", message: "feat: add user authentication module", branch: "main" }],
    addBranches: [{ name: "main", commitId: "d4e5f6a", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "d4e5f6a",
  },
  {
    command: "git commit -m \"docs: update README with setup instructions\"",
    narration: "Четвёртый коммит. Цепочка истории продолжается. Каждый коммит знает своего «родителя» — так Git строит полную историю.",
    addCommits: [{ id: "e5f6a7b", message: "docs: update README with setup instructions", branch: "main" }],
    addBranches: [{ name: "main", commitId: "e5f6a7b", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "e5f6a7b",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "В каком порядке git log показывает коммиты по умолчанию?",
    options: [
      "В алфавитном порядке по сообщению коммита",
      "От самого старого к самому новому",
      "От самого нового к самому старому (обратный хронологический порядок)",
      "В случайном порядке",
    ],
    correctIndex: 2,
    explanation:
      "git log по умолчанию показывает коммиты в обратном хронологическом порядке: самый последний коммит — первый в списке. Это удобно: ты сразу видишь последние изменения.",
  },
  {
    question: "Что добавляет флаг --oneline к команде git log?",
    options: [
      "Показывает только один коммит — самый последний",
      "Выводит каждый коммит в одну строку: сокращённый хеш + сообщение",
      "Ограничивает вывод одной веткой",
      "Показывает diff каждого коммита в одну строку",
    ],
    correctIndex: 1,
    explanation:
      "git log --oneline — компактный вид: каждый коммит занимает одну строку. Вместо полного 40-символьного хеша показывается сокращённый (7 символов), и рядом — сообщение коммита. Очень удобно для быстрого обзора истории.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Исследуй историю своего репозитория",
  description:
    "Создай несколько коммитов в своём репозитории (минимум 3-4) и изучи историю с помощью разных форматов git log. Попробуй найти конкретный коммит по его сообщению.",
  hint: 'Создай коммиты: echo "v1" > file.txt && git add . && git commit -m "feat: first feature". Повтори 2-3 раза с разными файлами. Затем: git log (полный), git log --oneline (компактный), git log --oneline --graph (с графом), git log --oneline -5 (последние 5)',
  verificationSteps: [
    "Создал минимум 3 коммита в репозитории",
    "Выполнил git log и прочитал полный вывод: хеш, автор, дата, сообщение",
    "Выполнил git log --oneline и увидел компактный вид",
    "Выполнил git log --oneline --graph --all для просмотра графа",
    "Понял, что каждый коммит имеет уникальный хеш (SHA-1)",
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
              text="Помнишь, я говорил, что Git — это машина времени? Вот мы добрались до пульта управления — git log. Это команда, которая показывает всю историю коммитов."
            />
            <NarrativeBox
              text="Каждый коммит имеет уникальный идентификатор — SHA-1 хеш: длинная строка вроде 'a3f4b2c1...'. Это как уникальный номер каждого «снимка» в нашем альбоме. По этому хешу можно найти любой коммит и вернуться к нему."
            />
            <NarrativeBox
              text="git log в чистом виде выдаёт много информации: хеш, автор, дата, сообщение. Но в больших проектах история может насчитывать тысячи коммитов. Для этого есть флаги: --oneline делает вывод компактным, --graph рисует ASCII-граф веток."
            />
            <NarrativeBox
              text="Хорошие сообщения коммитов — это инвестиция в будущее. Когда через 6 месяцев ты будешь читать лог и увидишь «fix bug» vs «fix: correct null pointer in user auth when token expires» — разница огромная."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Хочу увидеть git log в деле!
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
            <NarrativeBox text="Смотри, как растёт история коммитов и как её отображает git log в разных режимах." />

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
                  ? "Добавить коммит #2"
                  : vizStep === 1
                  ? "Добавить коммит #3"
                  : vizStep === 2
                  ? "Добавить коммит #4"
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
            <NarrativeBox text="Проверим знания о git log! Два вопроса о порядке вывода и флагах." />

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
            <NarrativeBox text="Пора путешествовать во времени! Создай историю коммитов и изучи её с помощью git log." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
