function escapeSystemdArg(value: string) {
  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("%", "%%");

  if (escaped.length === 0 || /\s/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

export default function createSystemdService(
  args: string[],
  stdoutPath: string,
  stderrPath: string,
) {
  const execStart = args.map(escapeSystemdArg).join(" ");
  return [
    "[Unit]",
    "Description=crnd daemon",
    "",
    "[Service]",
    `ExecStart=${execStart}`,
    "Restart=always",
    "RestartSec=1",
    `StandardOutput=append:${stdoutPath}`,
    `StandardError=append:${stderrPath}`,
    "",
    "[Install]",
    "WantedBy=default.target",
    "",
  ].join("\n");
}
