import { ParsedCommand } from "./types";

export function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();

  // Handle echo with redirect: echo "content" > file
  if (raw.startsWith("echo ")) {
    return parseEcho(raw);
  }

  const tokens = tokenize(raw);
  if (tokens.length === 0) {
    return { raw, program: "", subcommand: "", args: [], flags: {} };
  }

  const program = tokens[0];

  if (program === "git") {
    return parseGitCommand(raw, tokens.slice(1));
  }

  // Shell commands: cat, ls, rm
  return {
    raw,
    program,
    subcommand: "",
    args: tokens.slice(1),
    flags: {},
  };
}

function parseEcho(raw: string): ParsedCommand {
  const redirectIndex = raw.indexOf(">");
  const flags: Record<string, string | boolean> = {};
  let args: string[] = [];

  if (redirectIndex !== -1) {
    const content = raw.slice(5, redirectIndex).trim();
    const target = raw.slice(redirectIndex + 1).trim();
    args = [stripQuotes(content)];
    flags[">"] = target;
  } else {
    const content = raw.slice(5).trim();
    args = [stripQuotes(content)];
  }

  return { raw, program: "echo", subcommand: "", args, flags };
}

function parseGitCommand(raw: string, tokens: string[]): ParsedCommand {
  if (tokens.length === 0) {
    return { raw, program: "git", subcommand: "", args: [], flags: {} };
  }

  const subcommand = tokens[0];
  const rest = tokens.slice(1);
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  // Flags that consume the next token as their value
  const flagsWithValue = new Set(["m"]);

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];

    if (token.startsWith("--")) {
      const flagName = token.slice(2);
      flags[flagName] = true;
    } else if (token.startsWith("-") && token.length > 1) {
      const flagName = token.slice(1);
      if (flagsWithValue.has(flagName) && i + 1 < rest.length) {
        const nextToken = rest[i + 1];
        // Check if the next token looks like a flag-value or a standalone arg
        if (!nextToken.startsWith("-")) {
          flags[flagName] = stripQuotes(nextToken);
          i++;
        } else {
          flags[flagName] = true;
        }
      } else {
        flags[flagName] = true;
      }
    } else {
      args.push(stripQuotes(token));
    }
  }

  return { raw, program: "git", subcommand, args, flags };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuote) {
      if (ch === inQuote) {
        tokens.push(current);
        current = "";
        inQuote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      if (current) {
        tokens.push(current);
        current = "";
      }
      inQuote = ch;
    } else if (ch === " " || ch === "\t") {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }

  if (current) tokens.push(current);
  return tokens;
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}
