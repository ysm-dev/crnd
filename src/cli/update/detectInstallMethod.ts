import { execSync } from "node:child_process";

export type InstallMethod = "npm" | "bun" | "brew" | "unknown";

function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isInstalledViaBrew(): boolean {
  // Check if running from Homebrew Cellar
  const execPath = process.execPath;
  if (execPath.includes("/Cellar/") || execPath.includes("/homebrew/")) {
    return true;
  }

  // Check if brew knows about crnd
  if (commandExists("brew")) {
    try {
      execSync("brew list crnd", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function isInstalledViaNpm(): boolean {
  if (!commandExists("npm")) {
    return false;
  }

  try {
    const result = execSync("npm list -g crnd --depth=0 2>/dev/null", {
      encoding: "utf-8",
    });
    return result.includes("crnd@");
  } catch {
    return false;
  }
}

function isInstalledViaBun(): boolean {
  if (!commandExists("bun")) {
    return false;
  }

  try {
    const result = execSync("bun pm ls -g 2>/dev/null", { encoding: "utf-8" });
    return result.includes("crnd@");
  } catch {
    return false;
  }
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
