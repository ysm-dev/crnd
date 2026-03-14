import { defineCommand } from "citty";
import createRpcClient from "../../../shared/rpc/createRpcClient";
import removeDaemonState from "../../../shared/state/removeDaemonState";
import getDaemonSpawnArgs from "../../getDaemonSpawnArgs";
import waitForDaemonReady from "../../waitForDaemonReady";

export default function createDaemonStartCommand() {
  return defineCommand({
    meta: {
      name: "start",
      description: "Start the crnd daemon",
    },
    args: {
      json: {
        type: "boolean",
        alias: "j",
        description: "Output in JSON format",
      },
    },
    async run({ args }) {
      const existing = createRpcClient();
      if (existing) {
        try {
          const res = await existing.health.$get();
          if (res.ok) {
            const payload = { status: "already_running" };
            if (args.json) {
              console.log(JSON.stringify(payload));
            } else {
              console.log("daemon: already running");
            }
            return;
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

      const client = await waitForDaemonReady();
      if (client) {
        let data: unknown;
        try {
          const res = await client.health.$get();
          if (res.ok) {
            data = await res.json();
          }
        } catch {}

        if (args.json) {
          console.log(
            JSON.stringify(
              data
                ? { status: "started", daemon: data }
                : { status: "started" },
            ),
          );
        } else {
          console.log("daemon: started");
        }
        return;
      }

      const payload = { status: "start_timeout" };
      if (args.json) {
        console.log(JSON.stringify(payload));
      } else {
        console.log("daemon: start timeout");
      }
      process.exitCode = 3;
    },
  });
}
