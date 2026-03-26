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
  { text: "# Ситуация: работаем в feature/login, main ушла вперёд", type: "output" as const },
  { text: "git log --oneline --graph --all", type: "command" as const },
  { text: "* d3e4f5g (main) fix: security patch", type: "output" as const },
  { text: "* c3d4e5f feat: add auth middleware", type: "output" as const },
  { text: "| * b9a8c7d (HEAD -> feature/login) feat: login form", type: "output" as const },
  { text: "|/", type: "output" as const },
  { text: "* a1b2c3d feat: initial setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Rebase: «переиграем» наши коммиты поверх свежей main", type: "output" as const },
  { text: "git switch feature/login", type: "command" as const },
  { text: "git rebase main", type: "command" as const },
  { text: "Successfully rebased and updated refs/heads/feature/login.", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "git log --oneline --graph --all", type: "command" as const },
  { text: "* e5f6g7h (HEAD -> feature/login) feat: login form", type: "output" as const },
  { text: "* d3e4f5g (main) fix: security patch", type: "output" as const },
  { text: "* c3d4e5f feat: add auth middleware", type: "output" as const },
  { text: "* a1b2c3d feat: initial setup", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Линейная история! b9a8c7d 'переписан' как e5f6g7h", type: "success" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial setup", branch: "main", parent: undefined },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# До rebase: ветки разошлись",
    narration: "main ушла вперёд (два новых коммита), пока мы работали в feature/login. Наш коммит b9a8c7d базируется на старой точке a1b2c3d.",
    addCommits: [
      { id: "c3d4e5f", message: "feat: add auth middleware", branch: "main", parent: "a1b2c3d" },
      { id: "d3e4f5g", message: "fix: security patch", branch: "main", parent: "c3d4e5f" },
      { id: "b9a8c7d", message: "feat: login form", branch: "feature/login", parent: "a1b2c3d" },
    ],
    addBranches: [
      { name: "main", commitId: "d3e4f5g", color: "#3b82f6" },
      { name: "feature/login", commitId: "b9a8c7d", color: "#10b981" },
    ],
    moveHead: "feature/login",
    highlight: "b9a8c7d",
  },
  {
    command: "git rebase main",
    narration: "Rebase 'переигрывает' коммит b9a8c7d поверх d3e4f5g (вершина main). Создаётся НОВЫЙ коммит e5f6g7h с тем же содержимым, но другим хешем и новым родителем. Старый b9a8c7d больше не нужен — история стала линейной!",
    addCommits: [
      { id: "e5f6g7h", message: "feat: login form", branch: "feature/login", parent: "d3e4f5g" },
    ],
    addBranches: [{ name: "feature/login", commitId: "e5f6g7h", color: "#10b981" }],
    moveHead: "feature/login",
    highlight: "e5f6g7h",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что git rebase делает с коммитами ветки?",
    options: [
      "Копирует коммиты без изменений на новую базу",
      "Перемещает коммиты, сохраняя их хеши неизменными",
      "Создаёт новые коммиты с тем же содержимым, но другими хешами и новыми родителями",
      "Удаляет старые коммиты и создаёт один общий коммит",
    ],
    correctIndex: 2,
    explanation:
      "Rebase создаёт НОВЫЕ коммиты — с другими хешами. Содержимое (изменения кода) то же самое, но parent другой, а значит и хеш другой. Поэтому после rebase истории выглядят линейно: старые коммиты как бы 'переписаны' поверх новой базы.",
  },
  {
    question: "Когда НЕ следует делать rebase?",
    options: [
      "Когда ветка содержит больше 5 коммитов",
      "Когда ветка уже опубликована (push) и другие люди могут работать с ней",
      "Когда нужно сохранить линейную историю",
      "Когда ветка создана от main более недели назад",
    ],
    correctIndex: 1,
    explanation:
      "Золотое правило rebase: никогда не делай rebase публичных веток, с которыми работают другие. Rebase переписывает хеши коммитов — у коллег появятся 'фантомные' коммиты, и история расползётся. Rebase безопасен только для локальных веток, которые ещё не опубликованы.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Попробуй rebase",
  description:
    "Создай ситуацию с разошедшимися ветками: добавь коммит в main, отдельно добавь коммит в feature-ветку, затем rebase feature-ветки на main. Сравни историю до и после.",
  hint: "1) git switch -c feature/test. 2) Сделай коммит. 3) git switch main. 4) Сделай коммит на main. 5) git switch feature/test. 6) git log --oneline --graph --all (видишь ветвление). 7) git rebase main. 8) git log --oneline --graph --all (теперь линейно!).",
  verificationSteps: [
    "Создал ситуацию с разошедшимися ветками (коммиты и на main, и на feature)",
    "Запустил git log --oneline --graph --all — увидел ветвление в графе",
    "Выполнил git rebase main на feature-ветке",
    "Снова запустил git log --oneline --graph --all — история стала линейной",
    "Заметил, что хеш коммита feature-ветки изменился (это новый коммит!)",
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
              text="Ты работал над фичей три дня. За это время в main влили два хотфикса. Твоя ветка «устарела» — она базируется на старой версии main. Как обновиться? Можно merge, а можно rebase."
            />
            <NarrativeBox
              text="Rebase буквально означает «сменить базу». Git берёт твои коммиты, «снимает» их с текущей базы и «переигрывает» поверх новой. Результат: твои изменения лежат поверх свежей main, история линейная и чистая."
            />
            <NarrativeBox
              text="Важно понять: rebase создаёт НОВЫЕ коммиты. Твой коммит b9a8c7d становится e5f6g7h — другой хеш, другой родитель, но то же содержимое. Это 'переписывание истории'."
            />
            <NarrativeBox
              text="Золотое правило rebase: никогда не делай rebase веток, которые уже опубликованы и используются другими. Переписанные хеши вызовут хаос у коллег. Rebase — только для локальных веток."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать rebase в действии!
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
            <NarrativeBox text="Смотри: до rebase граф ветвится. После rebase — линейная история. Но хеш коммита изменился! Это и есть 'переписывание истории'." />

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
                {vizStep === 0 ? "git rebase main" : "Готово"}
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
            <NarrativeBox text="Два ключевых вопроса про rebase: что он делает и когда его НЕЛЬЗЯ применять." />

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
            <NarrativeBox text="Создай ситуацию с ветвлением и разреши её через rebase. Сравни граф до и после — увидишь магию линейной истории!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
