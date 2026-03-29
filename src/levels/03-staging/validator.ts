import { EngineState } from "@/engine/git-sandbox/types";
import { ValidationResult } from "@/components/sandbox/SandboxChallenge";

export function validate(state: EngineState): ValidationResult {
  const checks = [
    {
      label: "Файл app.js добавлен в staging area",
      passed: state.stagingArea.has("app.js"),
    },
    {
      label: "Создан коммит с файлом app.js",
      passed: state.commits.some(
        (c) => c.snapshot.has("app.js") && c.message !== "initial commit"
      ),
    },
  ];

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}
