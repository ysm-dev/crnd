import { existsSync } from "node:fs";
import getAutostartPath from "./getAutostartPath";
import getDaemonInstallArgs from "./getDaemonInstallArgs";

export default function ensureAutostart() {
  if (process.env.CRND_DISABLE_AUTOSTART === "1") {
    return { ok: true, reason: "disabled" };
  }

  const path = getAutostartPath();
  if (!path) {
    return { ok: false, reason: "unsupported_platform" };
  }

  if (process.platform === "win32") {
    const result = Bun.spawnSync(["schtasks", "/Query", "/TN", path]);
    if (result.success) {
      return { ok: true, reason: "already_installed" };
    }
  } else if (existsSync(path)) {
    return { ok: true, reason: "already_installed" };
  }

  const result = Bun.spawnSync(getDaemonInstallArgs());
  if (result.success) {
    return { ok: true, reason: "installed" };
  }

  return { ok: false, reason: "install_failed" };
}
