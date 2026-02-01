import path from "node:path";

export default function getDaemonInstallArgs() {
  const scriptPath = process.argv[1];
  if (scriptPath?.endsWith(".ts")) {
    return [process.execPath, path.resolve(scriptPath), "daemon", "install"];
  }

  return [process.execPath, "daemon", "install"];
}
