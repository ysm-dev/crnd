export default function createSystemdService(
  args: string[],
  stdoutPath: string,
  stderrPath: string,
) {
  const execStart = args
    .map((arg) => (arg.includes(" ") ? `"${arg}"` : arg))
    .join(" ");
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
