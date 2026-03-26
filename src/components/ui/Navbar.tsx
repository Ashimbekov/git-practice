"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameStorage } from "@/engine/storage";
import { PlayerData } from "@/types";

export function Navbar() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    setPlayer(GameStorage.load());
  }, []);

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg hover:text-indigo-400 transition-colors">
            🎮 GitQuest
          </Link>
          <Link
            href="/sandbox"
            className="text-sm text-gray-400 hover:text-indigo-400 transition-colors"
          >
            Песочница
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {player && (
            <>
              <span className="text-sm text-indigo-400">⭐ {player.totalXp} XP</span>
              <Link href="/profile" className="text-sm bg-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-700 transition-colors">
                {player.rank}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
