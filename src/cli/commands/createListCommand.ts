import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";

export default function createListCommand() {
  return defineCommand({
    meta: {
      name: "list",
      description: "List scheduled jobs",
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
        const res = await client.jobs.$get();
        if (!res.ok) {
          const payload = { status: "error", code: res.status };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`jobs: error (${res.status})`);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        if (data.length === 0) {
          console.log("jobs: none");
          return;
        }

        for (const job of data) {
          console.log(`${job.name} (${job.id})`);
        }
      } catch {
        const payload = { status: "unreachable" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: unreachable");
        }
        process.exitCode = 3;
      }
    },
  });
}
