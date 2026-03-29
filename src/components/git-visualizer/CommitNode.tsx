"use client";

import { motion } from "framer-motion";
import { GraphNode } from "./useGitGraph";

const RADIUS = 20;

interface CommitNodeProps {
  node: GraphNode;
  index: number;
}

export function CommitNode({ node, index }: CommitNodeProps) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Glow effect for HEAD */}
      {node.isHead && (
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={RADIUS + 8}
          fill="none"
          stroke={node.branchColor}
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.4}
          animate={{ r: [RADIUS + 6, RADIUS + 10, RADIUS + 6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Node circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={RADIUS}
        fill="#0f172a"
        stroke={node.branchColor}
        strokeWidth={3}
      />

      {/* Hash label inside */}
      <text
        x={node.x}
        y={node.y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={9}
        fontFamily="monospace"
        fontWeight={600}
      >
        {node.label}
      </text>

      {/* Commit message to the right */}
      <text
        x={node.x + RADIUS + 10}
        y={node.y + 1}
        dominantBaseline="central"
        fill="#94a3b8"
        fontSize={11}
      >
        {node.message}
      </text>

      {/* HEAD badge */}
      {node.isHead && (
        <g>
          <rect
            x={node.x - RADIUS - 42}
            y={node.y - 10}
            width={36}
            height={20}
            rx={10}
            fill="#e11d4820"
            stroke="#e11d4850"
            strokeWidth={1}
          />
          <text
            x={node.x - RADIUS - 24}
            y={node.y + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fb7185"
            fontSize={9}
            fontWeight={700}
          >
            HEAD
          </text>
        </g>
      )}

      {/* Tag badges */}
      {node.tags.map((tag, tagIdx) => {
        const tagWidth = tag.length * 7 + 16;
        const yOffset = node.isHead ? 16 : -4;
        return (
          <g key={tag}>
            <rect
              x={node.x - RADIUS - tagWidth - 8}
              y={node.y + yOffset + tagIdx * 24}
              width={tagWidth}
              height={20}
              rx={10}
              fill="#f59e0b20"
              stroke="#f59e0b50"
              strokeWidth={1}
            />
            <text
              x={node.x - RADIUS - tagWidth / 2 - 8}
              y={node.y + yOffset + 11 + tagIdx * 24}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fbbf24"
              fontSize={9}
              fontWeight={600}
            >
              🏷 {tag}
            </text>
          </g>
        );
      })}
    </motion.g>
  );
}
