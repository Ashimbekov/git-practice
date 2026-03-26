import { LevelMeta } from "@/types";
import { ComponentType } from "react";

import meta01 from "./01-init/meta.json";
import meta02 from "./02-first-commit/meta.json";
import meta03 from "./03-staging/meta.json";
import meta04 from "./04-status/meta.json";
import meta05 from "./05-log/meta.json";
import meta06 from "./06-diff/meta.json";
import meta07 from "./07-branch/meta.json";
import meta08 from "./08-switch/meta.json";
import meta09 from "./09-merge/meta.json";
import meta10 from "./10-rebase/meta.json";
import meta11 from "./11-head/meta.json";
import meta12 from "./12-clone/meta.json";
import meta13 from "./13-remote/meta.json";
import meta14 from "./14-push/meta.json";
import meta15 from "./15-pull/meta.json";
import meta16 from "./16-fetch/meta.json";
import meta17 from "./17-pr/meta.json";
import meta18 from "./18-issues/meta.json";
import meta19 from "./19-fork/meta.json";
import meta20 from "./20-code-review/meta.json";
import meta21 from "./21-stash/meta.json";
import meta22 from "./22-cherry-pick/meta.json";
import meta23 from "./23-reset/meta.json";
import meta24 from "./24-revert/meta.json";
import meta25 from "./25-reflog/meta.json";
import meta26 from "./26-merge-conflicts/meta.json";
import meta27 from "./27-git-flow/meta.json";
import meta28 from "./28-trunk-based/meta.json";
import meta29 from "./29-collaboration/meta.json";
import meta30 from "./30-objects/meta.json";
import meta31 from "./31-blobs-trees/meta.json";
import meta32 from "./32-refs-head/meta.json";
import meta33 from "./33-commit-messages/meta.json";

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
  { meta: meta07 as LevelMeta, load: () => import("./07-branch/Level") },
  { meta: meta08 as LevelMeta, load: () => import("./08-switch/Level") },
  { meta: meta09 as LevelMeta, load: () => import("./09-merge/Level") },
  { meta: meta10 as LevelMeta, load: () => import("./10-rebase/Level") },
  { meta: meta11 as LevelMeta, load: () => import("./11-head/Level") },
  { meta: meta12 as LevelMeta, load: () => import("./12-clone/Level") },
  { meta: meta13 as LevelMeta, load: () => import("./13-remote/Level") },
  { meta: meta14 as LevelMeta, load: () => import("./14-push/Level") },
  { meta: meta15 as LevelMeta, load: () => import("./15-pull/Level") },
  { meta: meta16 as LevelMeta, load: () => import("./16-fetch/Level") },
  { meta: meta17 as LevelMeta, load: () => import("./17-pr/Level") },
  { meta: meta18 as LevelMeta, load: () => import("./18-issues/Level") },
  { meta: meta19 as LevelMeta, load: () => import("./19-fork/Level") },
  { meta: meta20 as LevelMeta, load: () => import("./20-code-review/Level") },
  { meta: meta21 as LevelMeta, load: () => import("./21-stash/Level") },
  { meta: meta22 as LevelMeta, load: () => import("./22-cherry-pick/Level") },
  { meta: meta23 as LevelMeta, load: () => import("./23-reset/Level") },
  { meta: meta24 as LevelMeta, load: () => import("./24-revert/Level") },
  { meta: meta25 as LevelMeta, load: () => import("./25-reflog/Level") },
  { meta: meta26 as LevelMeta, load: () => import("./26-merge-conflicts/Level") },
  { meta: meta27 as LevelMeta, load: () => import("./27-git-flow/Level") },
  { meta: meta28 as LevelMeta, load: () => import("./28-trunk-based/Level") },
  { meta: meta29 as LevelMeta, load: () => import("./29-collaboration/Level") },
  { meta: meta30 as LevelMeta, load: () => import("./30-objects/Level") },
  { meta: meta31 as LevelMeta, load: () => import("./31-blobs-trees/Level") },
  { meta: meta32 as LevelMeta, load: () => import("./32-refs-head/Level") },
  { meta: meta33 as LevelMeta, load: () => import("./33-commit-messages/Level") },
];

export function getLevelById(id: string): LevelEntry | undefined {
  return LEVELS.find((l) => l.meta.id === id);
}

export function getLevelsBySection(section: string): LevelEntry[] {
  return LEVELS.filter((l) => l.meta.section === section);
}
