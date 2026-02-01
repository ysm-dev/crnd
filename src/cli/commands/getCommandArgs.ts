export default function getCommandArgs(argv: string[]) {
  const index = argv.indexOf("--");
  if (index === -1 || index >= argv.length - 1) {
    return [];
  }

  return argv.slice(index + 1);
}
