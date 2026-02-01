import os from "node:os";
import path from "node:path";

export default function getAutostartPath() {
  if (process.platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "LaunchAgents",
      "com.crnd.daemon.plist",
    );
  }

  if (process.platform === "linux") {
    return path.join(
      os.homedir(),
      ".config",
      "systemd",
      "user",
      "crnd.service",
    );
  }

  if (process.platform === "win32") {
    return "crnd";
  }

  return null;
}
