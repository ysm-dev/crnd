import createRpcClient from "../shared/rpc/createRpcClient";
import removeDaemonState from "../shared/state/removeDaemonState";
import getDaemonSpawnArgs from "./getDaemonSpawnArgs";
import waitForDaemonReady from "./waitForDaemonReady";

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

  return waitForDaemonReady();
}
