import { defineCommand } from "citty";
import ensureDaemon from "../ensureDaemon";
import formatApiError from "../errors/formatApiError";

export default function createResetCommand() {
  return defineCommand({
    meta: {
      name: "reset",
      description: "Reset job runs and scheduling state",
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        description: "Job name",
        required: true,
      },
      json: {
        type: "boolean",
        alias: "j",
        description: "Output in JSON format",
      },
    },
    async run({ args }) {
      const client = await ensureDaemon();
      if (!client) {
        const payload = { status: "daemon_start_failed", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("reset: daemon start failed");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs[":name"].reset.$post({
          param: { name: args.name },
        });
        if (res.status === 404) {
          const payload = {
            status: "not_found",
            code: 404,
            message: `Job "${args.name}" not found`,
          };
          if (args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`reset: job "${args.name}" not found`);
            console.log("  List available jobs with: crnd list");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "reset");
          if (args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(message);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        console.log(`reset: ${data.name}`);
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("reset: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
