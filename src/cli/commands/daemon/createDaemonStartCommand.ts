import { defineCommand } from "citty";
import createRpcClient from "../../../shared/rpc/createRpcClient";
import removeDaemonState from "../../../shared/state/removeDaemonState";
import getDaemonSpawnArgs from "../../getDaemonSpawnArgs";

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

      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const client = createRpcClient();
        if (!client) {
          continue;
        }
        try {
          const res = await client.health.$get();
          if (res.ok) {
            const data = await res.json();
            if (args.json) {
              console.log(JSON.stringify({ status: "started", daemon: data }));
            } else {
              console.log("daemon: started");
            }
            return;
          }
        } catch {}
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
