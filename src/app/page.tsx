"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LEVELS } from "@/levels/registry";
import { SECTIONS } from "@/levels/sections";
import { GameStorage } from "@/engine/storage";
import { PlayerData } from "@/types";

export default function Home() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    setPlayer(GameStorage.load());
  }, []);

  const completedLevels = player?.completedLevels ?? [];

  return (
    <main className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold mb-4">
            Изучай Git <span className="text-green-400">играючи</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Прокачай навыки работы с Git и GitHub через интерактивные задания,
            квизы и настоящие git-команды в браузере.
          </p>
        </motion.div>
      </section>

      {/* Level Map */}
      <div className="max-w-6xl mx-auto px-4 space-y-16">
        {SECTIONS.map((section, sectionIndex) => {
          const sectionLevels = LEVELS.filter(
            (l) => l.meta.section === section.id
          );
          const completedCount = sectionLevels.filter((l) =>
            completedLevels.includes(l.meta.id)
          ).length;
          const totalCount = sectionLevels.length;
          const progressPercent =
            totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
            >
              {/* Section Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                </div>
                <p className="text-gray-400 mb-3">{section.story}</p>

                {/* Progress indicator */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    {completedCount}/{totalCount} пройдено
                  </span>
                  <div className="flex-1 max-w-xs bg-gray-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, delay: sectionIndex * 0.1 + 0.3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Level Cards Grid */}
              {sectionLevels.length === 0 ? (
                <p className="text-gray-600 text-sm italic">
                  Уровни скоро появятся...
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectionLevels.map((level) => {
                    const isCompleted = completedLevels.includes(level.meta.id);

                    return (
                      <Link
                        key={level.meta.id}
                        href={`/level/${level.meta.id}`}
                        className={`block rounded-xl border p-5 transition-all hover:scale-[1.02] hover:shadow-lg ${
                          isCompleted
                            ? "bg-green-950/40 border-green-700/50 hover:border-green-500"
                            : "bg-gray-900 border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        {/* Status */}
                        <div className="flex items-center justify-between mb-3">
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                              <span>✅</span> Пройдено
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-500 text-sm">
                              <span>○</span> Не пройдено
                            </span>
                          )}
                          <span className="text-xs text-yellow-400 font-medium">
                            +{level.meta.xp} XP
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-lg mb-1">
                          {level.meta.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {level.meta.description}
                        </p>

                        {/* Footer info */}
                        <div className="flex items-center justify-between">
                          {/* Difficulty dots */}
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={
                                  i < level.meta.difficulty
                                    ? "text-orange-400 text-xs"
                                    : "text-gray-700 text-xs"
                                }
                              >
                                ●
                              </span>
                            ))}
                          </div>

                          {/* Estimated time */}
                          <span className="text-xs text-gray-500">
                            ~{level.meta.estimatedMinutes} мин
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
