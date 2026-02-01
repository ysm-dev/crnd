import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";

export default function createStopCommand() {
  return defineCommand({
    meta: {
      name: "stop",
      description: "Stop a running job"
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        required: true
      },
      json: {
        type: "boolean",
        alias: "j"
      }
    },
    async run({ args }) {
      const client = createRpcClient();
      if (!client) {
        const payload = { status: "unreachable" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: unreachable");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs[":name"].stop.$post({ param: { name: args.name } });
        if (res.status === 404) {
          const payload = { status: "not_found" };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("stop: job not found");
          }
          process.exitCode = 1;
          return;
        }

        if (res.status === 409) {
          const payload = { status: "not_running" };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("stop: no running job");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const payload = { status: "error", code: res.status };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`stop: error (${res.status})`);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        console.log(`stop: requested (${data.runId})`);
      } catch {
        const payload = { status: "unreachable" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: unreachable");
        }
        process.exitCode = 3;
      }
    }
  });
}
