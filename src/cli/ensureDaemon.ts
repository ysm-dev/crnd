import { existsSync, mkdirSync, watch } from "node:fs";
import path from "node:path";
import getStateDir from "../shared/paths/getStateDir";
import createRpcClient from "../shared/rpc/createRpcClient";
import removeDaemonState from "../shared/state/removeDaemonState";
import getDaemonSpawnArgs from "./getDaemonSpawnArgs";

/**
 * Waits for the daemon state file to exist using fs.watch (event-based, no polling).
 * Returns true if file appears within timeout, false otherwise.
 */
async function waitForStateFile(timeout: number): Promise<boolean> {
  const stateDir = getStateDir();
  const statePath = path.join(stateDir, "daemon.json");

  // If file already exists, return immediately
  if (existsSync(statePath)) {
    return true;
  }

  // Ensure state directory exists for watching
  mkdirSync(stateDir, { recursive: true });

  return new Promise((resolve) => {
    let done = false;

    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      watcher.close();
      resolve(ok);
    };

    const timeoutId = setTimeout(() => finish(false), timeout);

    const watcher = watch(stateDir, (_, filename) => {
      if (
        (filename === "daemon.json" || filename === null) &&
        existsSync(statePath)
      ) {
        finish(true);
      }
    });

    watcher.on("error", () => finish(false));

    // Re-check after watcher setup to handle race condition
    if (existsSync(statePath)) finish(true);
  });
}

/**
 * Ensures the daemon is running, auto-starting it if necessary.
 * Returns the RPC client if successful, null if daemon couldn't be started.
 */
export default async function ensureDaemon() {
  // First, check if daemon is already running
  const existing = createRpcClient();
  if (existing) {
    try {
      const res = await existing.health.$get();
      if (res.ok) {
        return existing;
      }
    } catch {
      // Daemon state exists but daemon is not responding, clean up
      removeDaemonState();
    }
  }

  // Daemon not running, start it
  const proc = Bun.spawn(getDaemonSpawnArgs(), {
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
  });
  proc.unref();

  // Wait for daemon state file to appear (daemon writes it after server is ready)
  const ready = await waitForStateFile(5000);
  if (!ready) {
    return null;
  }

  // State file exists, daemon should be ready - create client and verify
  const client = createRpcClient();
  if (!client) {
    return null;
  }

  try {
    const res = await client.health.$get();
    if (res.ok) {
      return client;
    }
  } catch {
    // Connection failed despite state file existing
  }

  return null;
}
