"use client";

import { motion } from "framer-motion";
import { GraphEdge as GraphEdgeType } from "./useGitGraph";

interface GraphEdgeProps {
  edge: GraphEdgeType;
  index: number;
}

export function GraphEdge({ edge, index }: GraphEdgeProps) {
  const isStraight = edge.sourceX === edge.targetX;

  let path: string;
  if (isStraight) {
    path = `M ${edge.sourceX} ${edge.sourceY + 20} L ${edge.targetX} ${edge.targetY - 20}`;
  } else {
    // Curved path for cross-branch edges
    const midY = (edge.sourceY + edge.targetY) / 2;
    path = `M ${edge.sourceX} ${edge.sourceY + 20} C ${edge.sourceX} ${midY}, ${edge.targetX} ${midY}, ${edge.targetX} ${edge.targetY - 20}`;
  }

  return (
    <motion.path
      d={path}
      fill="none"
      stroke={edge.color}
      strokeWidth={edge.dashed ? 1.5 : 2.5}
      strokeDasharray={edge.dashed ? "6 4" : undefined}
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
    />
  );
}
