import { runMain, showUsage } from "citty";
import createRootCommand from "./commands/createRootCommand";
import autoUpdate from "./update/autoUpdate";

type HelpCommand = Parameters<typeof showUsage>[0] & {
  subCommands?: Record<string, HelpCommand>;
};

function resolveHelpCommand(rootCommand: HelpCommand, argv: string[]) {
  const helpIndex = argv.findIndex((arg) => arg === "--help" || arg === "-h");
  if (helpIndex === -1) {
    return null;
  }

  const separatorIndex = argv.indexOf("--");
  if (separatorIndex !== -1 && separatorIndex < helpIndex) {
    return null;
  }

  let current: HelpCommand = rootCommand;
  for (const arg of argv.slice(0, helpIndex)) {
    if (arg === "--" || arg.startsWith("-")) {
      break;
    }
    const next = current.subCommands?.[arg];
    if (!next) {
      break;
    }
    current = next;
  }

  return current;
}

export default async function runCli() {
  const args = process.argv.slice(2);
  const rootCommand = createRootCommand() as HelpCommand;
  const helpCommand = resolveHelpCommand(rootCommand, args);
  if (helpCommand) {
    showUsage(helpCommand);
    return;
  }

  // Auto-update check (before command execution, like brew)
  // Skip for certain commands that shouldn't trigger updates
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

  return runMain(rootCommand);
}

runCli();
