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
  { text: "# Посмотрим статус только что клонированного проекта", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch main", type: "output" as const },
  { text: "nothing to commit, working tree clean", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Создадим новый файл", type: "output" as const },
  { text: "echo 'console.log(\"hello\")' > app.js", type: "command" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch main", type: "output" as const },
  { text: "Untracked files:", type: "output" as const },
  { text: "  (use \"git add <file>...\" to include in what will be committed)", type: "output" as const },
  { text: "        app.js", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "# Изменим уже отслеживаемый файл", type: "output" as const },
  { text: "echo 'update' >> README.md", type: "command" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch main", type: "output" as const },
  { text: "Changes not staged for commit:", type: "output" as const },
  { text: "  (use \"git add <file>...\" to update what will be committed)", type: "output" as const },
  { text: "        modified:   README.md", type: "error" as const },
  { text: "Untracked files:", type: "output" as const },
  { text: "        app.js", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "git add README.md", type: "command" as const },
  { text: "git status", type: "command" as const },
  { text: "On branch main", type: "output" as const },
  { text: "Changes to be committed:", type: "success" as const },
  { text: "        modified:   README.md", type: "success" as const },
  { text: "Changes not staged for commit:", type: "output" as const },
  { text: "Untracked files:", type: "output" as const },
  { text: "        app.js", type: "error" as const },
  { text: "", type: "output" as const },
  { text: "# Смотрим что именно изменилось", type: "output" as const },
  { text: "git diff", type: "command" as const },
  { text: "diff --git a/README.md b/README.md", type: "output" as const },
  { text: "--- a/README.md", type: "output" as const },
  { text: "+++ b/README.md", type: "output" as const },
  { text: "@@ -1 +1,2 @@", type: "output" as const },
  { text: " # My Project", type: "output" as const },
  { text: "+update", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "Initial commit: add README", branch: "main" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Состояния файлов в Git",
    narration: "У каждого файла в Git есть состояние: Untracked (не отслеживается), Modified (изменён), Staged (в очереди на коммит), Committed (зафиксирован).",
    addBranches: [{ name: "main", commitId: "a1b2c3d", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "a1b2c3d",
  },
  {
    command: "git add README.md && git commit -m \"update README\"",
    narration: "После коммита файл снова становится Committed — рабочее дерево чистое. Цикл завершён.",
    addCommits: [{ id: "b2c3d4e", message: "update README", branch: "main" }],
    addBranches: [{ name: "main", commitId: "b2c3d4e", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что означает статус «Untracked» для файла?",
    options: [
      "Файл повреждён и не может быть прочитан Git'ом",
      "Файл существует в рабочей папке, но Git ещё не знает о нём — он никогда не был добавлен через git add",
      "Файл был удалён из репозитория",
      "Файл находится в staging area и готов к коммиту",
    ],
    correctIndex: 1,
    explanation:
      "Untracked означает, что файл новый и Git о нём не знает. Git видит его в папке, но не отслеживает его изменения. Чтобы Git начал отслеживать файл, нужно выполнить git add.",
  },
  {
    question: "Чем отличается git diff от git diff --staged?",
    options: [
      "git diff показывает только новые файлы, а git diff --staged — только удалённые",
      "git diff показывает изменения между рабочей копией и staging area; git diff --staged — между staging area и последним коммитом",
      "Разницы нет, это одна и та же команда",
      "git diff работает только с бинарными файлами",
    ],
    correctIndex: 1,
    explanation:
      "git diff показывает изменения, которые ещё не добавлены в staging area (то, что ты изменил, но ещё не git add). git diff --staged (или git diff --cached) показывает, что уже добавлено в staging area и войдёт в следующий коммит.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Читай статус как профессионал",
  description:
    "Создай несколько файлов и изменений, затем изучи вывод git status. Убедись, что понимаешь каждую строку: что в staging area, что изменено, что не отслеживается.",
  hint: 'Попробуй: создай новый файл (echo "new" > new.txt), измени существующий (echo "change" >> README.md), выполни git status. Добавь только README.md (git add README.md) и снова git status. Обрати внимание на разницу цветов.',
  verificationSteps: [
    "Создал новый файл (Untracked) и изменил существующий (Modified)",
    "Выполнил git status и увидел оба состояния",
    "Добавил один файл через git add и снова проверил статус",
    "Использовал git diff, чтобы увидеть конкретные изменения",
    "Понял разницу между Untracked, Modified и Staged",
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
              text="Когда ты работаешь над проектом, файлы постоянно меняются. Git отслеживает каждый файл и присваивает ему состояние. Умение читать эти состояния — ключевой навык."
            />
            <NarrativeBox
              text="Файл может быть в одном из состояний: Untracked (новый файл, Git не знает о нём), Modified (файл изменён, но изменения не добавлены в staging), Staged (добавлен через git add, готов к коммиту), Committed (зафиксирован в истории)."
            />
            <NarrativeBox
              text="Команда git status — это твой компас. Она всегда скажет тебе, где ты находишься: какие файлы изменены, какие готовы к коммиту, какие Git не отслеживает."
            />
            <NarrativeBox
              text="А git diff — это увеличительное стекло. Если git status говорит «файл изменён», git diff покажет ИМЕННО, что изменилось: какие строки добавились (зелёный +), какие удалились (красный -)."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Покажи на примере!
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
            <NarrativeBox text="Наблюдай, как меняется вывод git status при разных операциях. Обрати внимание на цвета и формулировки." />

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
                {vizStep === 0 ? "Показать цикл состояний" : vizStep === 1 ? "git commit" : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=04-status"
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
            <NarrativeBox text="Проверим, как ты разобрался в состояниях файлов и командах git status и git diff." />

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
            <NarrativeBox text="Отличная работа! Теперь попрактикуйся сам — научись читать git status как открытую книгу. Этот навык сэкономит тебе тысячи часов." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
