import { spawnSync } from "node:child_process";

export type InstallMethod = "npm" | "bun" | "brew" | "unknown";

function commandExists(cmd: string): boolean {
  const locator = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(locator, [cmd], { stdio: "ignore" });
  return result.status === 0 && !result.error;
}

function isInstalledViaBrew(): boolean {
  // Check if running from Homebrew Cellar
  const execPath = process.execPath;
  if (execPath.includes("/Cellar/") || execPath.includes("/homebrew/")) {
    return true;
  }

  // Check if brew knows about crnd
  if (commandExists("brew")) {
    const result = spawnSync("brew", ["list", "crnd"], { stdio: "ignore" });
    return result.status === 0 && !result.error;
  }

  return false;
}

function isInstalledViaNpm(): boolean {
  if (!commandExists("npm")) {
    return false;
  }

  const result = spawnSync("npm", ["list", "-g", "crnd", "--depth=0"], {
    encoding: "utf-8",
  });
  return result.status === 0 && result.stdout.includes("crnd@");
}

function isInstalledViaBun(): boolean {
  if (!commandExists("bun")) {
    return false;
  }

  const result = spawnSync("bun", ["pm", "ls", "-g"], {
    encoding: "utf-8",
  });
  return result.status === 0 && result.stdout.includes("crnd@");
}

export default function detectInstallMethod(): InstallMethod {
  // Check brew first (most specific path check)
  if (isInstalledViaBrew()) {
    return "brew";
  }

  // Check bun (prefer bun over npm if both exist)
  if (isInstalledViaBun()) {
    return "bun";
  }

  // Check npm
  if (isInstalledViaNpm()) {
    return "npm";
  }

  return "unknown";
}
