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
  { text: "# Смотрим список объектов в .git/objects", type: "output" as const },
  { text: "find .git/objects -type f", type: "command" as const },
  { text: ".git/objects/3b/18e512dba79e4c8300dd08aeb37f8e728b8dad", type: "output" as const },
  { text: ".git/objects/9d/aeafb9864cf43055ae93beb0afd6c7d144bfa4", type: "output" as const },
  { text: ".git/objects/a9/5b4e1c9e2f3d4567890abcdef1234567890ab", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Определяем тип объекта по SHA-1", type: "output" as const },
  { text: "git cat-file -t 3b18e512dba79e4c8300dd08aeb37f8e728b8dad", type: "command" as const },
  { text: "blob", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "git cat-file -t 9daeafb9864cf43055ae93beb0afd6c7d144bfa4", type: "command" as const },
  { text: "tree", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "git cat-file -t a95b4e1c9e2f3d4567890abcdef1234567890ab", type: "command" as const },
  { text: "commit", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Читаем содержимое commit-объекта", type: "output" as const },
  { text: "git cat-file -p a95b4e1c9e2f3d4567890abcdef1234567890ab", type: "command" as const },
  { text: "tree 9daeafb9864cf43055ae93beb0afd6c7d144bfa4", type: "output" as const },
  { text: "author Alex <alex@example.com> 1710000000 +0000", type: "output" as const },
  { text: "committer Alex <alex@example.com> 1710000000 +0000", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "Initial commit", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Читаем содержимое blob-объекта", type: "output" as const },
  { text: "git cat-file -p 3b18e512dba79e4c8300dd08aeb37f8e728b8dad", type: "command" as const },
  { text: "Hello, Git!", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a95b4e1", message: "Initial commit", branch: "main", parent: undefined },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "# Commit → Tree → Blob",
    narration: "Каждый коммит — это объект с SHA-1 хешем. Он указывает на tree (снимок директории), которая в свою очередь указывает на blobs (содержимое файлов).",
    addBranches: [{ name: "main", commitId: "a95b4e1", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "a95b4e1",
  },
  {
    command: "git cat-file -p HEAD",
    narration: "Commit-объект содержит: ссылку на tree, автора, committer, временну́ю метку и сообщение. Это весь «снимок» репозитория в данный момент времени.",
    addCommits: [
      { id: "b72c3d9", message: "feat: add README", branch: "main", parent: "a95b4e1" },
    ],
    addBranches: [{ name: "main", commitId: "b72c3d9", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "b72c3d9",
  },
  {
    command: "# Все объекты неизменяемы (immutable)",
    narration: "Как только объект создан, его SHA-1 хеш не меняется. Если изменить хоть один байт содержимого — хеш станет другим. Это делает историю Git тамперо-защищённой.",
    addCommits: [
      { id: "c83d4e0", message: "fix: correct typo in README", branch: "main", parent: "b72c3d9" },
    ],
    addBranches: [{ name: "main", commitId: "c83d4e0", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c83d4e0",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Какие 4 типа объектов существуют в Git?",
    options: [
      "file, folder, snapshot, history",
      "blob, tree, commit, tag",
      "add, commit, push, pull",
      "branch, merge, rebase, reset",
    ],
    correctIndex: 1,
    explanation:
      "Git хранит данные в 4 типах объектов: blob (содержимое файла), tree (содержимое директории — список blob и tree), commit (снимок + метаданные: автор, время, сообщение, ссылка на tree), tag (аннотированный тег, указывающий на commit). Все объекты адресуются по SHA-1 хешу своего содержимого.",
  },
  {
    question: "Что такое content-addressable storage в Git?",
    options: [
      "Хранение файлов по имени и пути, как в обычной файловой системе",
      "Каждый объект адресуется SHA-1 хешем своего содержимого",
      "Система хранения только текстовых файлов",
      "Хранение истории в облаке по адресу URL",
    ],
    correctIndex: 1,
    explanation:
      "Content-addressable storage означает: адрес объекта — это хеш его содержимого. SHA-1 хеш вычисляется из содержимого файла (blob), структуры директории (tree) или метаданных коммита. Это гарантирует целостность: изменение содержимого всегда даёт другой адрес. Git cat-file позволяет читать любой объект по его SHA-1.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Исследуй объекты Git",
  description:
    "Создай репозиторий, сделай коммит и исследуй внутреннюю структуру объектов с помощью git cat-file.",
  hint: "1) git init && echo 'Hello Git' > hello.txt && git add hello.txt && git commit -m 'first commit'. 2) git cat-file -t HEAD — посмотри тип HEAD. 3) git cat-file -p HEAD — читай коммит, найди хеш tree. 4) git cat-file -p <tree-hash> — смотри содержимое tree. 5) git cat-file -p <blob-hash> — читай сам файл.",
  verificationSteps: [
    "Создал репозиторий и сделал первый коммит",
    "Выполнил git cat-file -t HEAD — убедился что тип 'commit'",
    "Выполнил git cat-file -p HEAD — прочитал содержимое коммита",
    "Нашёл хеш tree в выводе коммита",
    "Выполнил git cat-file -p <tree-hash> — увидел список blobs",
    "Прочитал содержимое blob через git cat-file -p <blob-hash>",
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
              text="Бонус: заглядываем под капот. Ты уже умеешь работать с Git — теперь давай разберёмся, как он устроен внутри. Это сделает тебя настоящим мастером!"
            />
            <NarrativeBox
              text="Git — это база данных объектов с адресацией по содержимому (content-addressable storage). Каждый объект хранится по своему SHA-1 хешу — 40-символьной строке, которая вычисляется из содержимого объекта. В папке .git/objects лежат все объекты репозитория."
            />
            <NarrativeBox
              text="В Git есть 4 типа объектов: blob — содержимое одного файла. tree — снимок директории (список файлов и поддиректорий). commit — снимок всего репозитория + автор + время + сообщение + ссылка на tree. tag — аннотированный тег, указывающий на конкретный commit."
            />
            <NarrativeBox
              text="Команда git cat-file — инструмент для работы с объектами. git cat-file -t <hash> покажет тип объекта, а git cat-file -p <hash> — его содержимое в читаемом виде. Так ты можешь «заглянуть» внутрь любого объекта Git!"
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Посмотреть под капот!
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
            <NarrativeBox text="Смотри, как git cat-file раскрывает внутреннюю структуру: commit → tree → blob. Каждый объект адресован SHA-1 хешем своего содержимого." />

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
                  ? "Читаем commit-объект"
                  : vizStep === 1
                  ? "Добавляем коммит"
                  : vizStep === 2
                  ? "Объекты неизменяемы"
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
            <NarrativeBox text="Два вопроса про внутреннее устройство Git. Понимание объектной модели откроет тебе многое!" />

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
            <NarrativeBox text="Самое интересное — исследовать объекты своего репозитория! Попробуй пройти всю цепочку: коммит → tree → blob." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
