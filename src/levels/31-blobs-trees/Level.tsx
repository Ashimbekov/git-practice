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
  { text: "# Хешируем файл вручную (без добавления в репо)", type: "output" as const },
  { text: "echo 'Hello, Git!' | git hash-object --stdin", type: "command" as const },
  { text: "8ab686eafeb1f44702738c8b0f24f2567c36da6d", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Хешируем и сразу записываем в объектную БД", type: "output" as const },
  { text: "echo 'Hello, Git!' | git hash-object --stdin -w", type: "command" as const },
  { text: "8ab686eafeb1f44702738c8b0f24f2567c36da6d", type: "success" as const },
  { text: "", type: "output" as const },
  { text: "# Просматриваем tree текущего коммита", type: "output" as const },
  { text: "git ls-tree HEAD", type: "command" as const },
  { text: "100644 blob 8ab686eafeb1f44702738c8b0f24f2567c36da6d\thello.txt", type: "output" as const },
  { text: "100644 blob a8c3f45b72e1d9f0c2b4e6a9d3f7c1e5b8a2d4f6\tREADME.md", type: "output" as const },
  { text: "040000 tree 3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d\tsrc", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Рекурсивно смотрим все файлы", type: "output" as const },
  { text: "git ls-tree -r HEAD --name-only", type: "command" as const },
  { text: "README.md", type: "output" as const },
  { text: "hello.txt", type: "output" as const },
  { text: "src/index.js", type: "output" as const },
  { text: "src/utils.js", type: "output" as const },
  { text: "", type: "output" as const },
  { text: "# Дедупликация: одинаковые файлы → один blob!", type: "output" as const },
  { text: "cp hello.txt hello-copy.txt && git add . && git commit -m 'add copy'", type: "command" as const },
  { text: "[main f1a2b3c] add copy", type: "success" as const },
  { text: "git ls-tree HEAD", type: "command" as const },
  { text: "100644 blob 8ab686eafeb1f44702738c8b0f24f2567c36da6d\thello-copy.txt", type: "output" as const },
  { text: "100644 blob 8ab686eafeb1f44702738c8b0f24f2567c36da6d\thello.txt", type: "output" as const },
  { text: "# ^ Одинаковый хеш — один blob на диске!", type: "output" as const },
];

const initialCommits: GitCommitNode[] = [
  { id: "a1b2c3d", message: "Initial commit", branch: "main", parent: undefined },
];

const visualizerSteps: GitVisualizerStep[] = [
  {
    command: "git ls-tree HEAD",
    narration: "Tree-объект — это снимок директории. Он содержит список записей: для каждого файла — тип (blob/tree), хеш объекта и имя. Это как inode-таблица в Git.",
    addBranches: [{ name: "main", commitId: "a1b2c3d", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "a1b2c3d",
  },
  {
    command: "git hash-object --stdin -w",
    narration: "Blob — это просто содержимое файла. Git не хранит имя файла в blob! Имя файла знает только tree. Благодаря этому один blob может быть referenced из нескольких tree.",
    addCommits: [
      { id: "b2c3d4e", message: "feat: add src/index.js", branch: "main", parent: "a1b2c3d" },
    ],
    addBranches: [{ name: "main", commitId: "b2c3d4e", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "b2c3d4e",
  },
  {
    command: "cp hello.txt hello-copy.txt",
    narration: "Дедупликация: если два файла имеют одинаковое содержимое, Git хранит только один blob. Копия файла не занимает дополнительное место в .git/objects — это один из способов экономии пространства.",
    addCommits: [
      { id: "c3d4e5f", message: "add copy (same blob reused)", branch: "main", parent: "b2c3d4e" },
    ],
    addBranches: [{ name: "main", commitId: "c3d4e5f", color: "#3b82f6" }],
    moveHead: "main",
    highlight: "c3d4e5f",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Что хранит blob-объект в Git?",
    options: [
      "Имя файла и его содержимое",
      "Только содержимое файла (без имени)",
      "Список файлов в директории",
      "Метаданные коммита: автор и время",
    ],
    correctIndex: 1,
    explanation:
      "Blob хранит только содержимое файла — без имени, без прав доступа. Имя файла и права (например, 100644) хранятся в tree-объекте, который ссылается на blob. Это и есть ключ к дедупликации: одинаковое содержимое = одинаковый SHA-1 = один blob на диске.",
  },
  {
    question: "Почему дублирующиеся файлы не занимают лишнее место в Git?",
    options: [
      "Git сжимает все файлы в zip-архив",
      "Git удаляет дубликаты автоматически при push",
      "Content-addressable storage: одинаковое содержимое → одинаковый SHA-1 → один blob",
      "Git хранит только diff между файлами",
    ],
    correctIndex: 2,
    explanation:
      "Если два файла (или два разных коммита) содержат одинаковые данные, их SHA-1 будет идентичным. Git просто создаст ссылку на уже существующий blob, а не скопирует данные. Это автоматическая дедупликация через content-addressable storage. Команда git ls-tree покажет, что оба файла указывают на один хеш.",
  },
];

const challengeTask: ChallengeTask = {
  title: "Исследуй blobs и trees",
  description:
    "Используй git hash-object и git ls-tree, чтобы понять как Git хранит файлы. Убедись в дедупликации!",
  hint: "1) git init && echo 'test content' > file1.txt && cp file1.txt file2.txt. 2) git add . && git commit -m 'two identical files'. 3) git ls-tree HEAD — посмотри хеши обоих файлов. 4) Убедись, что хеши одинаковые! 5) find .git/objects -type f — видишь, что blob один. 6) git hash-object file1.txt — проверь хеш вручную.",
  verificationSteps: [
    "Создал два файла с одинаковым содержимым",
    "Сделал коммит с обоими файлами",
    "Выполнил git ls-tree HEAD — увидел оба файла с одинаковым blob-хешем",
    "Убедился в дедупликации: два файла → один blob в .git/objects",
    "Использовал git hash-object для ручного хеширования файла",
    "Использовал git ls-tree -r HEAD для рекурсивного просмотра файлов",
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
              text="Теперь разберёмся глубже: как именно Git хранит файлы (blobs) и структуру директорий (trees). Это объяснит, почему Git такой эффективный!"
            />
            <NarrativeBox
              text="Blob (binary large object) — это содержимое одного файла. Важно: blob не знает имени файла! Он хранит только данные. SHA-1 хеш вычисляется из типа, размера и содержимого. Команда git hash-object позволяет вручную хешировать любой файл."
            />
            <NarrativeBox
              text="Tree — это снимок директории. Каждая запись в tree: права доступа (100644 для файла, 040000 для директории), тип (blob/tree), SHA-1 хеш и имя. Команда git ls-tree HEAD показывает tree текущего коммита. git ls-tree -r HEAD рекурсивно раскрывает все вложенные директории."
            />
            <NarrativeBox
              text="Дедупликация — магия content-addressable storage. Если два файла содержат одинаковые данные, их SHA-1 совпадёт, и Git сохранит только один blob. Это работает и между коммитами: файлы, которые не изменились, не дублируются в .git/objects."
            />

            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
            >
              Смотреть в терминале!
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
            <NarrativeBox text="git hash-object и git ls-tree — твои инструменты для исследования внутренностей Git. Смотри, как работает дедупликация на практике." />

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
                  ? "Blob: только данные"
                  : vizStep === 1
                  ? "Дедупликация!"
                  : vizStep === 2
                  ? "Экономия места"
                  : "Готово"}
              </button>
              <button
                onClick={goToNextStep}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Дальше
              </button>
              <Link
                href="/sandbox?level=31-blobs-trees"
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
            <NarrativeBox text="Проверяем знания о blobs и trees. Эти концепции помогут тебе понять, почему Git такой быстрый и эффективный." />

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
            <NarrativeBox text="Время доказать дедупликацию собственными глазами! Создай два одинаковых файла и убедись, что Git хранит только один blob." />

            <Challenge task={challengeTask} onComplete={handleChallengeComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
