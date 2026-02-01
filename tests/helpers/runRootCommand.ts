import path from "node:path";
import { runCommand } from "citty";
import createRootCommand from "../../src/cli/commands/createRootCommand";

export default async function runRootCommand(rawArgs: string[]) {
  const originalArgv = process.argv;
  const execPath = originalArgv[0] ?? "bun";
  const scriptPath = path.resolve("src/cli/main.ts");
  process.exitCode = 0;
  process.argv = [execPath, scriptPath, ...rawArgs];
  try {
    await runCommand(createRootCommand(), { rawArgs });
  } finally {
    process.argv = originalArgv;
  }

  return process.exitCode ?? 0;
}
