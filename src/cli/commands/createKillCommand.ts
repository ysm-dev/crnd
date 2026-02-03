import { defineCommand } from "citty";
import ensureDaemon from "../ensureDaemon";
import formatApiError from "../errors/formatApiError";

export default function createKillCommand() {
  return defineCommand({
    meta: {
      name: "kill",
      description: "Kill a running job",
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
      const client = await ensureDaemon();
      if (!client) {
        const payload = { status: "daemon_start_failed", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("kill: daemon start failed");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs[":name"].kill.$post({
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
            console.log(`kill: job "${args.name}" not found`);
            console.log("  List available jobs with: crnd list");
          }
          process.exitCode = 1;
          return;
        }

        if (res.status === 409) {
          const payload = {
            status: "not_running",
            code: 409,
            message: `Job "${args.name}" is not currently running`,
          };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`kill: job "${args.name}" is not currently running`);
            console.log(`  Check job status with: crnd status -n ${args.name}`);
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "kill");
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

        console.log(`kill: requested (${data.runId})`);
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("kill: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
