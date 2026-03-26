"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { GitCommitNode, GitVisualizerStep } from "@/types";
import { buildInitialState, applyStep } from "@/lib/git-graph";
import { useGitGraph } from "./useGitGraph";
import { CommitNodeType } from "./CommitNode";

interface GitVisualizerProps {
  initial: GitCommitNode[];
  steps: GitVisualizerStep[];
  currentStep: number;
}

const nodeTypes: NodeTypes = {
  commitNode: CommitNodeType,
};

export function GitVisualizer({ initial, steps, currentStep }: GitVisualizerProps) {
  const state = useMemo(() => {
    let s = buildInitialState(initial);
    for (let i = 0; i < currentStep; i++) {
      s = applyStep(s, steps[i]);
    }
    return s;
  }, [initial, steps, currentStep]);

  const { nodes, edges } = useGitGraph(state);

  const currentNarration = currentStep > 0 ? steps[currentStep - 1]?.narration : null;
  const currentCommand = currentStep > 0 ? steps[currentStep - 1]?.command : null;

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-gray-500 mb-2">Git граф</div>

      <div className="flex gap-2 mb-3">
        {state.branches.map((b) => (
          <span
            key={b.name}
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: `${b.color}20`,
              color: b.color,
              border: `1px solid ${b.color}40`,
            }}
          >
            {b.name}
            {state.head === b.name && " \u2190 HEAD"}
          </span>
        ))}
      </div>

      <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden bg-black/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#333" gap={20} />
        </ReactFlow>
      </div>

      <AnimatePresence mode="wait">
        {currentCommand && (
          <motion.div
            key={currentCommand}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 bg-gray-900 rounded-lg px-4 py-2 font-mono text-sm text-emerald-400"
          >
            $ {currentCommand}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
