import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";
import formatApiError from "../errors/formatApiError";

export default function createRunOnceCommand() {
  return defineCommand({
    meta: {
      name: "run-once",
      description: "Run a job immediately",
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
          console.log("run-once: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs.run.$post({ json: { name: args.name } });
        if (res.status === 404) {
          const payload = {
            status: "not_found",
            code: 404,
            message: `Job "${args.name}" not found`,
          };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`run-once: job "${args.name}" not found`);
            console.log("  List available jobs with: crnd list");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "run-once");
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

        const suffix = data.runId ? ` run ${data.runId}` : "";
        console.log(`run-once: started (${data.jobId})${suffix}`);
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("run-once: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
