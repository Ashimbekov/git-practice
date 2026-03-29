"use client";

import { useMemo } from "react";
import { GitGraphState } from "@/types";

const NODE_RADIUS = 20;
const Y_SPACING = 80;
const X_SPACING = 120;
const PADDING_X = 60;
const PADDING_Y = 40;

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  message: string;
  branchColor: string;
  branchName: string;
  isHead: boolean;
  tags: string[];
}

export interface GraphEdge {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  color: string;
  dashed: boolean;
}

export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}

export function useGitGraph(state: GitGraphState): GraphLayout {
  return useMemo(() => {
    // Assign columns to branches (main always 0)
    const branchColumns: Record<string, number> = {};
    let nextCol = 0;
    state.branches.forEach((b) => {
      if (b.name === "main" || b.name === "master") {
        branchColumns[b.name] = 0;
      }
    });
    if (Object.keys(branchColumns).length > 0) nextCol = 1;
    state.branches.forEach((b) => {
      if (!(b.name in branchColumns)) {
        branchColumns[b.name] = nextCol++;
      }
    });

    const nodePositions: Record<string, { x: number; y: number }> = {};

    const nodes: GraphNode[] = state.commits.map((commit, i) => {
      const branch = state.branches.find((b) => b.name === commit.branch);
      const col = branchColumns[commit.branch] ?? 0;
      const x = col * X_SPACING + PADDING_X;
      const y = i * Y_SPACING + PADDING_Y;

      nodePositions[commit.id] = { x, y };

      const commitTags = (state.tags ?? [])
        .filter((t) => t.commitId === commit.id)
        .map((t) => t.name);

      return {
        id: commit.id,
        x,
        y,
        label: commit.id.slice(0, 7),
        message: commit.message,
        branchColor: branch?.color ?? "#6b7280",
        branchName: commit.branch,
        isHead: state.head === commit.branch && branch?.commitId === commit.id,
        tags: commitTags,
      };
    });

    const edges: GraphEdge[] = [];
    state.commits.forEach((commit) => {
      if (commit.parent && nodePositions[commit.parent]) {
        const source = nodePositions[commit.parent];
        const target = nodePositions[commit.id];
        const branch = state.branches.find((b) => b.name === commit.branch);
        edges.push({
          id: `${commit.parent}-${commit.id}`,
          sourceX: source.x,
          sourceY: source.y,
          targetX: target.x,
          targetY: target.y,
          color: branch?.color ?? "#6b7280",
          dashed: false,
        });
      }
      if (commit.secondParent && nodePositions[commit.secondParent]) {
        const source = nodePositions[commit.secondParent];
        const target = nodePositions[commit.id];
        edges.push({
          id: `${commit.secondParent}-${commit.id}`,
          sourceX: source.x,
          sourceY: source.y,
          targetX: target.x,
          targetY: target.y,
          color: "#6b7280",
          dashed: true,
        });
      }
    });

    const maxCol = Math.max(0, ...Object.values(branchColumns));
    const width = Math.max(300, (maxCol + 1) * X_SPACING + PADDING_X * 2);
    const height = Math.max(200, state.commits.length * Y_SPACING + PADDING_Y * 2);

    return { nodes, edges, width, height };
  }, [state]);
}
