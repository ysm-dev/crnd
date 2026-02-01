export default function getDaemonSpawnArgs() {
  const [execPath, scriptPath] = process.argv;

  if (scriptPath?.endsWith(".ts")) {
    return [execPath, scriptPath, "daemon", "serve"];
  }

  return [execPath, "daemon", "serve"];
}
