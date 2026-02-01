import path from "node:path";

export default function getDaemonInstallArgs() {
  const [execPath, scriptPath] = process.argv;
  if (scriptPath?.endsWith(".ts")) {
    return [execPath, path.resolve(scriptPath), "daemon", "install"];
  }

  return [execPath, "daemon", "install"];
}
