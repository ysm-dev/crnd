import path from "node:path";

type GetDaemonInstallArgsOptions = {
  noStart?: boolean;
};

export default function getDaemonInstallArgs(
  options: GetDaemonInstallArgsOptions = {},
) {
  const args = ["daemon", "install"];
  if (options.noStart) {
    args.push("--no-start");
  }

  const scriptPath = process.argv[1];
  if (scriptPath?.endsWith(".ts")) {
    return [process.execPath, path.resolve(scriptPath), ...args];
  }

  return [process.execPath, ...args];
}
