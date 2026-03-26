"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";

interface CommitNodeData {
  label: string;
  message: string;
  branchColor: string;
  isHead: boolean;
  isHighlighted: boolean;
}

function CommitNodeComponent({ data }: NodeProps) {
  const { label, message, branchColor, isHead, isHighlighted } = data as unknown as CommitNodeData;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />

      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-mono border-[3px] transition-all ${
          isHighlighted ? "ring-4 ring-offset-2 ring-offset-gray-950" : ""
        }`}
        style={{
          borderColor: branchColor,
          backgroundColor: "#1a1a2e",
        }}
      >
        {label}
      </div>

      {isHead && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -right-16 top-1/2 -translate-y-1/2 bg-rose-600/30 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full"
        >
          HEAD
        </motion.div>
      )}

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap max-w-[100px] truncate">
        {message}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    </motion.div>
  );
}

export const CommitNodeType = memo(CommitNodeComponent);
