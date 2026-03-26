import { LevelMeta } from "@/types";
import { ComponentType } from "react";

import meta01 from "./01-init/meta.json";
import meta02 from "./02-first-commit/meta.json";
import meta03 from "./03-staging/meta.json";
import meta04 from "./04-status/meta.json";
import meta05 from "./05-log/meta.json";
import meta06 from "./06-diff/meta.json";

interface LevelEntry {
  meta: LevelMeta;
  load: () => Promise<{ default: ComponentType<{ onComplete: (correct: number, total: number) => void }> }>;
}

export const LEVELS: LevelEntry[] = [
  { meta: meta01 as LevelMeta, load: () => import("./01-init/Level") },
  { meta: meta02 as LevelMeta, load: () => import("./02-first-commit/Level") },
  { meta: meta03 as LevelMeta, load: () => import("./03-staging/Level") },
  { meta: meta04 as LevelMeta, load: () => import("./04-status/Level") },
  { meta: meta05 as LevelMeta, load: () => import("./05-log/Level") },
  { meta: meta06 as LevelMeta, load: () => import("./06-diff/Level") },
];

export function getLevelById(id: string): LevelEntry | undefined {
  return LEVELS.find((l) => l.meta.id === id);
}

export function getLevelsBySection(section: string): LevelEntry[] {
  return LEVELS.filter((l) => l.meta.section === section);
}
