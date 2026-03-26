import { LevelMeta } from "@/types";
import { ComponentType } from "react";

import meta01 from "./01-init/meta.json";
import meta02 from "./02-first-commit/meta.json";

interface LevelEntry {
  meta: LevelMeta;
  load: () => Promise<{ default: ComponentType<{ onComplete: (correct: number, total: number) => void }> }>;
}

export const LEVELS: LevelEntry[] = [
  { meta: meta01 as LevelMeta, load: () => import("./01-init/Level") },
  { meta: meta02 as LevelMeta, load: () => import("./02-first-commit/Level") },
];

export function getLevelById(id: string): LevelEntry | undefined {
  return LEVELS.find((l) => l.meta.id === id);
}

export function getLevelsBySection(section: string): LevelEntry[] {
  return LEVELS.filter((l) => l.meta.section === section);
}
