"use client";

import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { GitGraphState } from "@/types";

const Y_SPACING = 100;
const X_SPACING = 160;

export function useGitGraph(state: GitGraphState) {
  return useMemo(() => {
    const branchColumns: Record<string, number> = {};
    state.branches.forEach((b, i) => {
      branchColumns[b.name] = i;
    });

    const nodes: Node[] = state.commits.map((commit, i) => {
      const branch = state.branches.find((b) => b.name === commit.branch);
      const col = branchColumns[commit.branch] ?? 0;

      return {
        id: commit.id,
        type: "commitNode",
        position: { x: col * X_SPACING + 80, y: i * Y_SPACING + 40 },
        data: {
          label: commit.id.slice(0, 4),
          message: commit.message,
          branchColor: branch?.color ?? "#6b7280",
          isHead:
            state.head === commit.branch &&
            branch?.commitId === commit.id,
          isHighlighted: false,
        },
        draggable: false,
      };
    });

    const edges: Edge[] = [];
    state.commits.forEach((commit) => {
      if (commit.parent) {
        const branch = state.branches.find((b) => b.name === commit.branch);
        edges.push({
          id: `${commit.parent}-${commit.id}`,
          source: commit.parent,
          target: commit.id,
          style: { stroke: branch?.color ?? "#6b7280", strokeWidth: 2.5 },
          type: "smoothstep",
        });
      }
      if (commit.secondParent) {
        edges.push({
          id: `${commit.secondParent}-${commit.id}`,
          source: commit.secondParent,
          target: commit.id,
          style: { stroke: "#6b7280", strokeWidth: 1.5, strokeDasharray: "6 3" },
          type: "smoothstep",
        });
      }
    });

    return { nodes, edges };
  }, [state]);
}
