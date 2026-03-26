"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitCommitNode, GitVisualizerStep } from "@/types";
import { buildInitialState, applyStep } from "@/lib/git-graph";
import { useGitGraph } from "./useGitGraph";
import { CommitNode } from "./CommitNode";
import { GraphEdge } from "./GraphEdge";

interface GitVisualizerProps {
  initial: GitCommitNode[];
  steps: GitVisualizerStep[];
  currentStep: number;
}

export function GitVisualizer({ initial, steps, currentStep }: GitVisualizerProps) {
  const state = useMemo(() => {
    let s = buildInitialState(initial);
    for (let i = 0; i < currentStep; i++) {
      s = applyStep(s, steps[i]);
    }
    return s;
  }, [initial, steps, currentStep]);

  const { nodes, edges, width, height } = useGitGraph(state);

  const currentCommand = currentStep > 0 ? steps[currentStep - 1]?.command : null;

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-gray-500 mb-2 font-medium tracking-wide uppercase">
        Git граф
      </div>

      {/* Branch labels */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {state.branches.map((b) => (
          <span
            key={b.name}
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              backgroundColor: `${b.color}15`,
              color: b.color,
              border: `1px solid ${b.color}30`,
            }}
          >
            {b.name}
            {state.head === b.name && " ← HEAD"}
          </span>
        ))}
      </div>

      {/* SVG Graph */}
      <div className="flex-1 min-h-0 rounded-xl overflow-auto bg-black/30 border border-gray-800/50">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            Пустой репозиторий
          </div>
        ) : (
          <svg
            width="100%"
            height={Math.max(height, 200)}
            viewBox={`0 0 ${width} ${height}`}
            className="block"
          >
            {/* Edges first (behind nodes) */}
            {edges.map((edge, i) => (
              <GraphEdge key={edge.id} edge={edge} index={i} />
            ))}

            {/* Nodes on top */}
            {nodes.map((node, i) => (
              <CommitNode key={node.id} node={node} index={i} />
            ))}
          </svg>
        )}
      </div>

      {/* Current command display */}
      <AnimatePresence mode="wait">
        {currentCommand && (
          <motion.div
            key={currentCommand}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 bg-gray-900/80 border border-gray-800/50 rounded-lg px-4 py-2.5 font-mono text-sm text-emerald-400"
          >
            <span className="text-gray-500">$ </span>
            {currentCommand}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
