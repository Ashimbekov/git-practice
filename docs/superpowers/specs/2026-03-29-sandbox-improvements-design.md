# Sandbox Improvements Design

Three improvements to the GitEngine sandbox: new commands, persistence, and level integration.

## 1. New GitEngine Commands

### git tag

- `git tag` — list all tags
- `git tag <name>` — create lightweight tag at HEAD
- `git tag <name> <commit>` — tag a specific commit
- `git tag -d <name>` — delete a tag
- State: `tags: Map<string, string>` added to `EngineState` (name -> commitId)
- Tags shown in `git log` output alongside branch labels
- Tags shown in `GitVisualizer` with distinct styling (different from branches)

File: `src/engine/git-sandbox/commands/tag.ts`

### git blame

- `git blame <file>` — show commit info per line (commitId, author, message)
- Traces through commit history to find which commit last changed each line
- Author is always "You" (single-user emulator)
- Error if file not found in latest commit snapshot

File: `src/engine/git-sandbox/commands/blame.ts`

### git bisect

- `git bisect start` — begin bisect session
- `git bisect bad [commit]` — mark commit as bad (defaults to HEAD)
- `git bisect good [commit]` — mark commit as good
- Engine auto-checkouts the midpoint commit between good and bad
- `git bisect reset` — end bisect and return to original HEAD
- State: `bisect: BisectState | null` added to `EngineState`
  ```ts
  interface BisectState {
    active: boolean;
    goodCommits: string[];
    badCommits: string[];
    originalHead: string;
    originalIsDetached: boolean;
  }
  ```

File: `src/engine/git-sandbox/commands/bisect.ts`

### Registration

All three commands registered in `commands/index.ts`. Completions added to `GitEngine.getCompletions()`.

## 2. Serialization & Persistence

### GitEngine serialization

- `GitEngine.serialize(): string` — serializes full `EngineState` + command `history` to JSON
- `GitEngine.deserialize(json: string): GitEngine` (static) — restores engine from JSON
- `Map` objects converted to `[key, value][]` arrays for JSON compatibility
- Nested Maps (e.g., `remotes` containing `RemoteState` with its own Maps) handled recursively

### localStorage schema

```ts
// Free sandbox
key: "gitquest-sandbox"
value: {
  engineState: string,      // GitEngine.serialize() output
  outputLines: OutputLine[], // terminal history
  savedAt: number            // Date.now()
}

// Level-specific sandbox
key: "gitquest-sandbox-level-{levelId}"
value: same shape
```

### Lifecycle

- **Auto-save:** after every command execution in `SandboxLayout.handleExecute`
- **Restore:** on `SandboxLayout` mount, check localStorage and hydrate if present
- **Reset:** "Reset" button clears both in-memory state and localStorage entry
- **Level sandbox isolation:** `/sandbox?level={id}` uses separate localStorage key, does not overwrite free sandbox state

## 3. Level Integration

### Presets

Each level may export a `preset.ts` alongside `Level.tsx`:

```ts
// levels/03-staging/preset.ts
import { EngineState } from "@/engine/git-sandbox/types";

export function createPreset(): EngineState {
  // Returns pre-configured state: initialized repo, files, commits, branches
}
```

Not all levels require a preset. Levels like `01-init` start from empty state.

### Validators

Each level with an interactive challenge exports a `validator.ts`:

```ts
// levels/03-staging/validator.ts
import { EngineState } from "@/engine/git-sandbox/types";

export interface ValidationCheck {
  label: string;
  passed: boolean;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}

export function validate(state: EngineState): ValidationResult {
  const checks: ValidationCheck[] = [
    {
      label: "Файл README.md добавлен в staging area",
      passed: state.stagingArea.has("README.md"),
    },
  ];
  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}
```

### Validation approach

State-based validation only. We check the final state of the engine (files, commits, branches, etc.), not the sequence of commands the user typed. This mirrors real Git usage where the result matters, not the path.

### SandboxChallenge component

New component: `src/components/sandbox/SandboxChallenge.tsx`

Props:
- `preset?: () => EngineState` — initial engine state
- `validate: (state: EngineState) => ValidationResult` — validation function
- `description: string` — task description for the user
- `onComplete: () => void` — called when user completes the challenge

Behavior:
- Embeds a mini-terminal (reuses `SandboxTerminal`)
- Shows validation checklist panel — runs `validate()` after each command
- Checks update in real-time with green/gray indicators
- "Complete" button enabled only when `validate().passed === true`
- Replaces the self-report `Challenge` component on the challenge step

### Registry extension

`LevelEntry` in `registry.ts` gains two optional fields:

```ts
interface LevelEntry {
  meta: LevelMeta;
  load: () => Promise<{ default: ComponentType<...> }>;
  loadPreset?: () => Promise<{ createPreset: () => EngineState }>;
  loadValidator?: () => Promise<{ validate: (state: EngineState) => ValidationResult }>;
}
```

Both are lazy-loaded like the level component itself.

### "Open in sandbox" button

Added to the visualization step of ALL levels (currently only levels 01-02 have it). Links to `/sandbox?level={id}`, which loads the level's preset into a full sandbox.

### Level.tsx changes

- Levels with a `loadValidator` use `SandboxChallenge` on the challenge step
- Levels without a validator keep the existing self-report `Challenge` component
- The `onComplete` callback from `SandboxChallenge` feeds into the same `handleComplete` flow

### What does NOT change

- `meta.json` format — unchanged
- Level step structure (narrative -> visualization -> quiz -> challenge) — unchanged
- Existing `Challenge` component — stays for levels without validator
- `/sandbox` without query param — remains free sandbox
- `SandboxLayout` three-panel layout — unchanged

## File Summary

New files:
- `src/engine/git-sandbox/commands/tag.ts`
- `src/engine/git-sandbox/commands/blame.ts`
- `src/engine/git-sandbox/commands/bisect.ts`
- `src/components/sandbox/SandboxChallenge.tsx`
- `src/levels/*/preset.ts` (per level, as needed)
- `src/levels/*/validator.ts` (per level, as needed)

Modified files:
- `src/engine/git-sandbox/types.ts` — add `tags`, `bisect` to `EngineState`
- `src/engine/git-sandbox/commands/index.ts` — register new commands
- `src/engine/git-sandbox/GitEngine.ts` — add `serialize()`/`deserialize()`, update `getCompletions()`, update `getGraphData()` to include tags, update `createEmptyState()` with new fields
- `src/components/sandbox/SandboxLayout.tsx` — add persistence (auto-save/restore), support `?level=` query param
- `src/components/git-visualizer/GitVisualizer.tsx` — render tags on commits
- `src/levels/registry.ts` — add `loadPreset`/`loadValidator` to `LevelEntry`
- `src/app/sandbox/page.tsx` — pass level query param to `SandboxLayout`
- Level `Level.tsx` files — add "Open in sandbox" button, use `SandboxChallenge` where validator exists
