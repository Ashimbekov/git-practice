import { EngineState } from "@/engine/git-sandbox/types";

export function createPreset(): EngineState {
  const commitId = "abc1234";
  const snapshot = new Map<string, string>([
    ["README.md", "# My Project"],
  ]);

  return {
    initialized: true,
    workingDir: new Map<string, string>([
      ["README.md", "# My Project"],
      ["app.js", 'console.log("hello");'],
    ]),
    stagingArea: new Map<string, string>([
      ["README.md", "# My Project"],
    ]),
    commits: [
      {
        id: commitId,
        message: "initial commit",
        timestamp: Date.now(),
        parentId: null,
        secondParentId: null,
        snapshot,
        branch: "main",
      },
    ],
    branches: new Map([["main", commitId]]),
    head: "main",
    isDetached: false,
    remotes: new Map(),
    stash: [],
    reflog: [{ commitId, action: "commit", message: "commit: initial commit" }],
    conflictFiles: new Map(),
    tags: new Map(),
    bisect: null,
  };
}
