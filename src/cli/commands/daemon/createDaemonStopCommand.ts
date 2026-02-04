import { defineCommand } from "citty";
import createRpcClient from "../../../shared/rpc/createRpcClient";

export default function createDaemonStopCommand() {
  return defineCommand({
    meta: {
      name: "stop",
      description: "Stop the crnd daemon",
    },
    args: {
      json: {
        type: "boolean",
        alias: "j",
      },
    },
    async run({ args }) {
      const client = createRpcClient();
      if (!client) {
        const payload = { status: "not_running" };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: not running");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.daemon.shutdown.$post();
        if (!res.ok) {
          const payload = { status: "stop_failed", code: res.status };
          if (args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`daemon: stop failed (${res.status})`);
          }
          process.exitCode = 3;
          return;
        }

        const payload = { status: "stopped" };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: stopped");
        }
      } catch {
        const payload = { status: "stop_failed" };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: stop failed");
        }
        process.exitCode = 3;
      }
    },
  });
}
