import { runMain } from "citty";
import createRootCommand from "./commands/createRootCommand";
import autoUpdate from "./update/autoUpdate";

export default async function runCli() {
  // Auto-update check (before command execution, like brew)
  // Skip for certain commands that shouldn't trigger updates
  const args = process.argv.slice(2);
  const firstArg = args[0];
  // Skip for subcommands that handle updates themselves
  const skipSubcommands = ["upgrade", "daemon"];
  // Skip for top-level flags (only when they're the first argument)
  const skipTopLevelFlags = ["--help", "-h", "--version", "-V"];
  const shouldSkipUpdate =
    skipSubcommands.some((cmd) => args.includes(cmd)) ||
    (firstArg && skipTopLevelFlags.includes(firstArg));

  if (!shouldSkipUpdate) {
    await autoUpdate();
  }

  return runMain(createRootCommand());
}

runCli();
