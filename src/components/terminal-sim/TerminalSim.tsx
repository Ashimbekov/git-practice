"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "success" | "error";
}

interface TerminalSimProps {
  lines: TerminalLine[];
  typingSpeed?: number;
}

export function TerminalSim({ lines, typingSpeed = 30 }: TerminalSimProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (visibleLines >= lines.length) return;

    const currentLine = lines[visibleLines];

    if (currentLine.type === "command") {
      setIsTyping(true);
      let charIndex = 0;
      const interval = setInterval(() => {
        charIndex++;
        setTypedText(currentLine.text.slice(0, charIndex));
        if (charIndex >= currentLine.text.length) {
          clearInterval(interval);
          setIsTyping(false);
          setTimeout(() => setVisibleLines((v) => v + 1), 300);
        }
      }, typingSpeed);
      return () => clearInterval(interval);
    } else {
      const timeout = setTimeout(() => setVisibleLines((v) => v + 1), 200);
      return () => clearTimeout(timeout);
    }
  }, [visibleLines, lines, typingSpeed]);

  const colorMap = {
    command: "text-gray-400",
    output: "text-white",
    success: "text-emerald-400",
    error: "text-red-400",
  };

  return (
    <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-sm overflow-hidden">
      <div className="flex gap-1.5 mb-3">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
      </div>

      <div className="space-y-1">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={colorMap[line.type]}
          >
            {line.type === "command" ? `$ ${line.text}` : line.text}
          </motion.div>
        ))}

        {isTyping && visibleLines < lines.length && lines[visibleLines].type === "command" && (
          <div className="text-gray-400">
            $ {typedText}
            <span className="animate-pulse">▊</span>
          </div>
        )}
      </div>
    </div>
  );
}
