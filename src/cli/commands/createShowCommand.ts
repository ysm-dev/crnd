import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";
import formatApiError from "../errors/formatApiError";

export default function createShowCommand() {
  return defineCommand({
    meta: {
      name: "show",
      description: "Show a job",
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
          console.log("show: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs[":name"].$get({
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
            console.log(`show: job "${args.name}" not found`);
            console.log("  List available jobs with: crnd list");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "show");
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

        console.log(`name: ${data.name}`);
        console.log(`id: ${data.id}`);
        if (data.description) {
          console.log(`description: ${data.description}`);
        }
        console.log(`command: ${data.command.join(" ")}`);
        if (data.scheduleType === "cron") {
          console.log(`schedule: ${data.cron ?? ""}`);
        } else {
          console.log(`runAt: ${data.runAt ?? ""}`);
        }
        if (data.timezone) {
          console.log(`timezone: ${data.timezone}`);
        }
        console.log(`paused: ${data.paused}`);
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("show: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
