export default function getDaemonSpawnArgs() {
  const scriptPath = process.argv[1];

  if (scriptPath?.endsWith(".ts")) {
    return [process.execPath, scriptPath, "daemon", "serve"];
  }

  return [process.execPath, "daemon", "serve"];
}
