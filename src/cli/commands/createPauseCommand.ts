import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";
import formatApiError from "../errors/formatApiError";

export default function createPauseCommand() {
  return defineCommand({
    meta: {
      name: "pause",
      description: "Pause a job",
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        required: true,
      },
      json: {
        type: "boolean",
        alias: "j",
      },
    },
    async run({ args }) {
      const client = createRpcClient();
      if (!client) {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("pause: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs[":name"].pause.$post({
          param: { name: args.name },
        });
        if (res.status === 404) {
          const payload = {
            status: "not_found",
            code: 404,
            message: `Job "${args.name}" not found`,
          };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`pause: job "${args.name}" not found`);
            console.log("  List available jobs with: crnd list");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "pause");
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(message);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        console.log(`pause: ${data.name}`);
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("pause: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
