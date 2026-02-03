import { spawnSync } from "node:child_process";
import createRpcClient from "../../shared/rpc/createRpcClient";
import removeDaemonState from "../../shared/state/removeDaemonState";
import getDaemonSpawnArgs from "../getDaemonSpawnArgs";
import detectInstallMethod, { type InstallMethod } from "./detectInstallMethod";

interface UpgradeResult {
  success: boolean;
  method: InstallMethod;
  error?: string;
  previousVersion?: string;
  newVersion?: string;
  daemonRestartFailed?: boolean;
}

async function isDaemonRunning(): Promise<boolean> {
  const client = createRpcClient();
  if (!client) {
    return false;
  }

  try {
    const res = await client.health.$get();
    return res.ok;
  } catch {
    return false;
  }
}

async function stopDaemon(): Promise<boolean> {
  const client = createRpcClient();
  if (!client) {
    return true;
  }

  try {
    await client.daemon.shutdown.$post();
    // Wait a bit for graceful shutdown
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  } catch {
    return false;
  }
}

async function startDaemon(): Promise<boolean> {
  // Clean up any stale state first
  const existing = createRpcClient();
  if (existing) {
    try {
      const res = await existing.health.$get();
      if (res.ok) {
        return true; // Already running
      }
    } catch {
      removeDaemonState();
    }
  }

  const proc = Bun.spawn(getDaemonSpawnArgs(), {
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
  });
  proc.unref();

  // Wait for daemon to be ready
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const client = createRpcClient();
    if (!client) {
      continue;
    }
    try {
      const res = await client.health.$get();
      if (res.ok) {
        return true;
      }
    } catch {}
  }

  return false;
}

function getUpdateCommand(
  method: InstallMethod,
  version?: string,
): string[] | null {
  const versionSpec = version ? `@${version}` : "@latest";
  switch (method) {
    case "npm":
      return ["npm", "install", "-g", `crnd${versionSpec}`];
    case "bun":
      return ["bun", "install", "-g", `crnd${versionSpec}`];
    case "brew":
      return ["brew", "upgrade", "crnd"]; // brew doesn't support version pinning
    default:
      return null;
  }
}

function runUpdateCommand(cmd: string[]): { success: boolean; error?: string } {
  const result = spawnSync(cmd[0], cmd.slice(1), {
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  if (result.status !== 0) {
    return { success: false, error: `Exit code ${result.status}` };
  }

  return { success: true };
}

export default async function performUpgrade(
  targetVersion?: string,
): Promise<UpgradeResult> {
  const method = detectInstallMethod();

  if (method === "unknown") {
    return {
      success: false,
      method,
      error:
        "Could not detect installation method. Please update manually:\n" +
        "  npm: npm install -g crnd@latest\n" +
        "  bun: bun install -g crnd@latest\n" +
        "  brew: brew upgrade crnd",
    };
  }

  const updateCmd = getUpdateCommand(method, targetVersion);
  if (!updateCmd) {
    return {
      success: false,
      method,
      error: "No update command available for this installation method",
    };
  }

  // Check if daemon is running before update
  const daemonWasRunning = await isDaemonRunning();

  // Stop daemon gracefully
  if (daemonWasRunning) {
    const stopped = await stopDaemon();
    if (!stopped) {
      return {
        success: false,
        method,
        error: "Failed to stop daemon before update",
      };
    }
  }

  // Run the update command
  const { success, error } = runUpdateCommand(updateCmd);

  if (!success) {
    // Try to restart daemon even if update failed
    let daemonRestartFailed = false;
    if (daemonWasRunning) {
      const restarted = await startDaemon();
      daemonRestartFailed = !restarted;
    }
    return {
      success: false,
      method,
      error: error ?? "Update command failed",
      daemonRestartFailed,
    };
  }

  // Restart daemon if it was running
  let daemonRestartFailed = false;
  if (daemonWasRunning) {
    const restarted = await startDaemon();
    daemonRestartFailed = !restarted;
  }

  return {
    success: true,
    method,
    newVersion: targetVersion,
    daemonRestartFailed,
  };
}
