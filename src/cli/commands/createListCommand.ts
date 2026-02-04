import { defineCommand } from "citty";
import ensureDaemon from "../ensureDaemon";
import formatApiError from "../errors/formatApiError";

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
      const client = await ensureDaemon();
      if (!client) {
        const payload = { status: "daemon_start_failed", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("list: daemon start failed");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs.$get();
        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "list");
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

        if (data.length === 0) {
          console.log("jobs: none");
          return;
        }

        for (const job of data) {
          console.log(`${job.name} (${job.id})`);
        }
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("list: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
