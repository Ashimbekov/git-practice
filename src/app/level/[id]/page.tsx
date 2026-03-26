"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getLevelById } from "@/levels/registry";
import { GameStorage } from "@/engine/storage";
import { completeLevel, addQuizScore } from "@/engine/progress";
import { checkNewBadges } from "@/engine/achievements";
import { LevelMeta } from "@/types";

type ComponentType = React.ComponentType<{
  onComplete: (quizCorrect: number, quizTotal: number) => void;
}>;

export default function LevelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [LevelComponent, setLevelComponent] = useState<ComponentType | null>(null);
  const [meta, setMeta] = useState<LevelMeta | null>(null);
  const [completed, setCompleted] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    const entry = getLevelById(id);
    if (!entry) {
      router.push("/");
      return;
    }
    setMeta(entry.meta);

    const player = GameStorage.load();
    GameStorage.save({
      ...player,
      levelStartTimes: { ...player.levelStartTimes, [id]: Date.now() },
    });

    entry.load().then((mod) => setLevelComponent(() => mod.default));
  }, [id, router]);

  function handleComplete(quizCorrect: number, quizTotal: number) {
    if (!meta) return;

    let player = GameStorage.load();
    player = addQuizScore(player, meta.id, quizCorrect, quizTotal);
    player = completeLevel(player, meta.id, meta.xp);

    const badges = checkNewBadges(player);
    if (badges.length > 0) {
      player = { ...player, badges: [...player.badges, ...badges] };
    }

    GameStorage.save(player);
    setNewBadges(badges);
    setCompleted(true);
  }

  if (!LevelComponent || !meta) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse text-gray-500">Загрузка уровня...</div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Уровень пройден!</h2>
          <p className="text-indigo-400 text-lg mb-2">+{meta.xp} XP</p>
          {newBadges.length > 0 && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 font-medium">Новые бейджи:</p>
              {newBadges.map((b) => (
                <span key={b} className="text-amber-300">{b} </span>
              ))}
            </div>
          )}
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              К карте уровней
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{meta.title}</h1>
        <p className="text-gray-400 text-sm mt-1">{meta.description}</p>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="text-indigo-400">⭐ {meta.xp} XP</span>
          <span className={meta.difficulty <= 2 ? "text-emerald-400" : meta.difficulty <= 4 ? "text-amber-400" : "text-red-400"}>
            {"●".repeat(meta.difficulty)}{"○".repeat(5 - meta.difficulty)} Сложность
          </span>
        </div>
      </div>
      <LevelComponent onComplete={handleComplete} />
    </div>
  );
}
