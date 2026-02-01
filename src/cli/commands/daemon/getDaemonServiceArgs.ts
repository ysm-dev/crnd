import path from "node:path";

export default function getDaemonServiceArgs() {
  const [execPath, scriptPath] = process.argv;
  if (scriptPath?.endsWith(".ts")) {
    return [execPath, path.resolve(scriptPath), "daemon", "serve"];
  }

  return [execPath, "daemon", "serve"];
}
