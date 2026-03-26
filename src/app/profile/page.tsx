"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameStorage } from "@/engine/storage";
import { BADGES } from "@/engine/achievements";
import { PlayerData, RANK_THRESHOLDS, Rank } from "@/types";

const RANK_ORDER: Rank[] = [
  "Intern",
  "Junior",
  "Middle",
  "Senior",
  "Lead",
  "Architect",
];

function getRankColor(rank: Rank): string {
  const colors: Record<Rank, string> = {
    Intern: "bg-gray-600 text-gray-200",
    Junior: "bg-green-700 text-green-100",
    Middle: "bg-blue-700 text-blue-100",
    Senior: "bg-purple-700 text-purple-100",
    Lead: "bg-orange-700 text-orange-100",
    Architect: "bg-yellow-600 text-yellow-100",
  };
  return colors[rank];
}

export default function ProfilePage() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    setPlayer(GameStorage.load());
  }, []);

  if (!player) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </main>
    );
  }

  // Rank & XP calculation
  const currentRankIndex = RANK_ORDER.indexOf(player.rank);
  const isMaxRank = currentRankIndex === RANK_ORDER.length - 1;
  const nextRank: Rank | null = isMaxRank ? null : RANK_ORDER[currentRankIndex + 1];
  const currentRankThreshold = RANK_THRESHOLDS[player.rank];
  const nextRankThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : null;

  const xpInCurrentRange = player.totalXp - currentRankThreshold;
  const xpNeededForNextRank = nextRankThreshold
    ? nextRankThreshold - currentRankThreshold
    : 0;
  const xpProgressPercent =
    !isMaxRank && xpNeededForNextRank > 0
      ? Math.min((xpInCurrentRange / xpNeededForNextRank) * 100, 100)
      : 100;

  // Quiz accuracy
  const quizScoreValues = Object.values(player.quizScores);
  const totalCorrect = quizScoreValues.reduce((sum, s) => sum + s.correct, 0);
  const totalQuestions = quizScoreValues.reduce((sum, s) => sum + s.total, 0);
  const quizAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-950 text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-10 space-y-8">
        {/* Profile Header */}
        <motion.div
          className="bg-gray-900 rounded-2xl border border-gray-800 p-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg">
            🧑‍💻
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold">Профиль</h1>

          {/* Rank Badge */}
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getRankColor(
              player.rank
            )}`}
          >
            {player.rank}
          </span>

          {/* XP Count */}
          <div className="text-center">
            <span className="text-2xl font-bold text-yellow-400">
              {player.totalXp} XP
            </span>
            {!isMaxRank && nextRankThreshold !== null && (
              <span className="text-gray-400 text-sm ml-2">
                / {nextRankThreshold} XP
              </span>
            )}
          </div>

          {/* XP Progress Bar */}
          <div className="w-full">
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* XP until next rank */}
          {!isMaxRank && nextRank && nextRankThreshold !== null && (
            <p className="text-sm text-gray-400">
              {Math.max(0, nextRankThreshold - player.totalXp)} XP до{" "}
              <span className="text-white font-medium">{nextRank}</span>
            </p>
          )}
          {isMaxRank && (
            <p className="text-sm text-yellow-400 font-medium">
              Максимальный ранг достигнут!
            </p>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-indigo-400">
              {player.completedLevels.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Уровней пройдено</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-green-400">
              {quizAccuracy}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Точность квизов</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {player.badges.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Бейджи</div>
          </div>
        </motion.div>

        {/* Badges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold mb-4">Достижения</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BADGES.map((badge) => {
              const isUnlocked = player.badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-4 flex flex-col items-center gap-2 text-center transition-all ${
                    isUnlocked
                      ? "bg-gray-900 border-indigo-700/60"
                      : "bg-gray-900/40 border-gray-800 opacity-50"
                  }`}
                >
                  <span className="text-3xl">
                    {isUnlocked ? badge.icon : "🔒"}
                  </span>
                  <div>
                    <div
                      className={`font-semibold text-sm ${
                        isUnlocked ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {badge.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {badge.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
