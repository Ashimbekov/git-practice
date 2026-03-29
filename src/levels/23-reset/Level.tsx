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
  { text: "git log --oneline", type: "command" as const },
  { text: "d4e5f6g (HEAD -> main) WIP: broken experiment", type: "output" as const },
  { text: "c3d4e5f feat: add user settings", type: "output" as const },
  { text: "b2c3d4e feat: add dashboard", type: "output" as const },
  { text: "a1b2c3d feat: initial commit", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# --soft: HEAD двигается, индекс и файлы сохраняются", type: "output" as const },
  { text: "git reset --soft HEAD~1", type: "command" as const },
  { text: "# d4e5f6g исчез из log, но изменения staged", type: "success" as const },
  { text: "git status", type: "command" as const },
  { text: "Changes to be committed:", type: "output" as const },
  { text: "  modified: experiment.js", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Восстанавливаем для следующего примера", type: "output" as const },
  { text: "git reset --hard HEAD~0", type: "command" as const },
  { text: "", type: "output" as const },
  { text: "# --mixed (по умолчанию): HEAD двигается, индекс сбрасывается, файлы сохраняются", type: "output" as const },
  { text: "git reset HEAD~1", type: "command" as const },
  { text: "Unstaged changes after reset:", type: "output" as const },
  { text: "M  experiment.js", type: "output" as const },
  { text: "git status", type: "command" as const },
  { text: "Changes not staged for commit:", type: "output" as const },
  { text: "  modified: experiment.js", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# --hard: HEAD двигается, индекс и файлы УНИЧТОЖАЮТСЯ", type: "output" as const },
  { text: "git reset --hard HEAD~1", type: "command" as const },
  { text: "HEAD is now at b2c3d4e feat: add dashboard", type: "output" as const },
  { text: "# ВНИМАНИЕ: experiment.js полностью удалён — не восстановить!", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "feat: initial commit", branch: "main", parent: undefined },
  { id: "b2c3d4e", message: "feat: add dashboard", branch: "main", parent: "a1b2c3d" },
  { id: "c3d4e5f", message: "feat: add user settings", branch: "main", parent: "b2c3d4e" },
  { id: "d4e5f6g", message: "WIP: broken experiment", branch: "main", parent: "c3d4e5f" },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Стартовое состояние: HEAD на d4e5f6g",
    narration: "Последний коммит d4e5f6g — незаконченный эксперимент. Хотим его убрать. У нас три режима reset: soft, mixed, hard. Все три двигают HEAD назад, но по-разному обращаются с файлами.",
    addBranches: [{ name: "main", commitId: "d4e5f6g", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "d4e5f6g",
  },
  {
    command: "git reset --soft HEAD~1",
    narration: "soft reset: HEAD и ветка переместились на c3d4e5f. Коммит d4e5f6g 'исчез' из истории, НО его изменения остались в индексе (staged). Можно сразу сделать новый коммит с исправленным сообщением или другими изменениями.",
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
  {
    command: "git reset --hard HEAD~1  (от c3d4e5f)",
    narration: "hard reset: HEAD переместился на b2c3d4e. Коммит c3d4e5f 'исчез'. Все изменения УНИЧТОЖЕНЫ — ни в индексе, ни в файлах ничего нет. Это необратимо! Используй только если точно знаешь, что делаешь.",
    addBranches: [{ name: "main", commitId: "b2c3d4e", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "git reset --soft HEAD~1 выполнен. Где окажутся изменения из «удалённого» коммита?",
    options: [
      "Полностью удалены — не восстановить",
      "В рабочей директории как unstaged изменения",
      "В индексе (staging area) — готовы к коммиту",
      "В новом stash",
    ],
    correctIndex: 2,
    explanation:
      "soft reset двигает только HEAD (и указатель ветки). Индекс (staging area) и рабочая директория остаются нетронутыми. Изменения из «убранного» коммита окажутся staged — как будто ты только что сделал git add, но ещё не commit.",
  },
  {
    question: "В чём опасность git reset --hard?",
    options: [
      "Он удаляет ветку из репозитория",
      "Он уничтожает незафиксированные изменения в файлах — их нельзя восстановить обычными средствами",
      "Он сбрасывает конфигурацию Git",
      "Он работает только с удалёнными ветками",
    ],
    correctIndex: 1,
    explanation:
      "git reset --hard уничтожает изменения в рабочей директории и индексе. Если ты не сделал коммит или stash — эти изменения потеряны навсегда (ну, почти — reflog может помочь, если коммит всё-таки был). Всегда дважды подумай перед --hard.",
  },
  {
    question: "Какой режим reset используется по умолчанию (git reset HEAD~1 без флага)?",
    options: [
      "--soft",
      "--hard",
      "--mixed",
      "--keep",
    ],
    correctIndex: 2,
    explanation:
      "git reset без флага — это git reset --mixed. HEAD и ветка двигаются назад, индекс сбрасывается (изменения становятся unstaged), но файлы в рабочей директории сохраняются. Золотая середина между soft и hard.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Попрактикуй git reset --soft",
  description:
    "Сделай два коммита подряд, затем используй git reset --soft HEAD~1, чтобы «объединить» их в один — распространённый сценарий в реальной работе.",
  hint: "1) Сделай первый коммит (git add + git commit). 2) Сделай второй коммит. 3) git log --oneline — видишь два коммита. 4) git reset --soft HEAD~1. 5) git status — изменения staged! 6) git commit -m 'объединённый коммит'. 7) git log — теперь один коммит.",
  verificationSteps: [
    "Сделал два коммита подряд на ветке",
    "Выполнил git reset --soft HEAD~1",
    "Проверил git status — изменения оказались в staged (Changes to be committed)",
    "Создал новый коммит, объединивший изменения",
    "Проверил git log --oneline — количество коммитов уменьшилось",
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
              text="Ты сделал несколько коммитов, и что-то пошло не так. Нужно «откатить» историю. git reset — мощный инструмент для этого, но он существует в трёх очень разных режимах."
            />
            <NarrativeBox
              text="git reset --soft HEAD~1: самый мягкий режим. HEAD двигается назад, но все изменения из «убранного» коммита остаются в индексе (staged). Идеально, если хочешь переделать коммит — изменить сообщение или добавить что-то."
            />
            <NarrativeBox
              text="git reset --mixed HEAD~1 (режим по умолчанию): HEAD двигается назад, индекс сбрасывается, но файлы в рабочей директории сохраняются. Изменения оказываются unstaged — можно решить, что с ними делать."
            />
            <NarrativeBox
              text="git reset --hard HEAD~1: самый жёсткий режим. HEAD двигается назад, индекс сбрасывается И файлы в рабочей директории приводятся к состоянию указанного коммита. Незафиксированные изменения УНИЧТОЖАЮТСЯ. Без возврата."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Показать все три режима!
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
            <NarrativeBox text="На графе видно: HEAD движется назад, коммиты как бы 'исчезают'. Разница — только в том, что происходит с файлами." />

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
                  ? "git reset --soft HEAD~1"
                  : vizStep === 1
                  ? "git reset --hard HEAD~1"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=23-reset"
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
            <NarrativeBox text="Три вопроса про режимы reset. Запомни таблицу: soft = только HEAD; mixed = HEAD + индекс; hard = HEAD + индекс + файлы." />

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
            <NarrativeBox text="Практикуй git reset --soft для объединения коммитов — это один из самых частых сценариев использования. Убедись, что изменения остаются в staged после сброса!" />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
