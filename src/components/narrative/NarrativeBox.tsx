"use client";

import { motion } from "framer-motion";

interface NarrativeBoxProps {
  text: string;
  mentorName?: string;
}

export function NarrativeBox({ text, mentorName = "Алекс" }: NarrativeBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4"
    >
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-lg">
          🧑‍💻
        </div>
        <div>
          <div className="font-semibold text-sm mb-1">{mentorName} (наставник)</div>
          <div className="text-gray-300 text-sm leading-relaxed">{text}</div>
        </div>
      </div>
    </motion.div>
  );
}
