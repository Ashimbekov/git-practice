"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QuizQuestion } from "@/types";

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (correct: number, total: number) => void;
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const question = questions[currentIndex];
  const isCorrect = selectedAnswer === question.correctIndex;
  const isLast = currentIndex === questions.length - 1;

  function handleSelect(optionIndex: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIndex);
    if (optionIndex === question.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    if (isLast) {
      const finalCorrect = correctCount;
      setShowResult(true);
      onComplete(finalCorrect, questions.length);
    } else {
      setSelectedAnswer(null);
      setCurrentIndex((i) => i + 1);
    }
  }

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
      >
        <h3 className="text-xl font-bold mb-2">Результат квиза</h3>
        <p className="text-gray-300">
          {correctCount} из {questions.length} правильно
        </p>
        {correctCount === questions.length && (
          <p className="text-emerald-400 mt-2 font-medium">
            Идеально! +50 бонусного XP
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Вопрос {currentIndex + 1} из {questions.length}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-5">{question.question}</h3>

      <div className="space-y-3">
        {question.options.map((option, i) => {
          let className =
            "w-full text-left px-4 py-3 rounded-lg border transition-all ";

          if (selectedAnswer === null) {
            className += "border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10 cursor-pointer";
          } else if (i === question.correctIndex) {
            className += "border-emerald-500 bg-emerald-500/10";
          } else if (i === selectedAnswer) {
            className += "border-red-500 bg-red-500/10 opacity-60";
          } else {
            className += "border-gray-700 opacity-40";
          }

          return (
            <motion.button
              key={i}
              whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
              onClick={() => handleSelect(i)}
              className={className}
            >
              <span className="text-gray-500 mr-3 font-mono">
                {String.fromCharCode(65 + i)})
              </span>
              {option}
            </motion.button>
          );
        })}
      </div>

      {selectedAnswer !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-4 rounded-lg border ${
            isCorrect
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <p className={`font-medium ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
            {isCorrect ? "Верно!" : "Неверно"}
          </p>
          <p className="text-sm text-gray-300 mt-1">{question.explanation}</p>

          <button
            onClick={handleNext}
            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            {isLast ? "Завершить квиз" : "Следующий вопрос →"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
