import path from "node:path";

export default function getDaemonServiceArgs() {
  const scriptPath = process.argv[1];
  if (scriptPath?.endsWith(".ts")) {
    return [process.execPath, path.resolve(scriptPath), "daemon", "serve"];
  }

  return [process.execPath, "daemon", "serve"];
}
