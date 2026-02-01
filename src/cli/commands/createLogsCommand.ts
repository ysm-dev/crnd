import { readFileSync } from "node:fs";
import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";
import formatApiError from "../errors/formatApiError";

export default function createLogsCommand() {
  return defineCommand({
    meta: {
      name: "logs",
      description: "Show latest run logs for a job",
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        required: true,
      },
      show: {
        type: "boolean",
        alias: "s",
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
          console.log("logs: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs[":name"].runs.$get({
          param: { name: args.name },
          query: { limit: "1" },
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
            console.log(`logs: job "${args.name}" not found`);
            console.log("  List available jobs with: crnd list");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "logs");
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(message);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          const payload = {
            status: "no_runs",
            code: 200,
            message: `Job "${args.name}" has no runs yet`,
          };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`logs: job "${args.name}" has no runs yet`);
            console.log(`  Trigger a run with: crnd run-once -n ${args.name}`);
          }
          return;
        }

        const run = data[0];
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(run));
          return;
        }

        if (!run.stdoutPath && !run.stderrPath) {
          console.log("logs: no output paths");
          return;
        }

        if (!args.show) {
          if (run.stdoutPath) {
            console.log(`stdout: ${run.stdoutPath}`);
          }
          if (run.stderrPath) {
            console.log(`stderr: ${run.stderrPath}`);
          }
          return;
        }

        if (run.stdoutPath) {
          try {
            console.log("-- stdout --");
            console.log(readFileSync(run.stdoutPath, "utf-8"));
          } catch {
            console.log("logs: stdout file missing");
          }
        }
        if (run.stderrPath) {
          try {
            console.log("-- stderr --");
            console.log(readFileSync(run.stderrPath, "utf-8"));
          } catch {
            console.log("logs: stderr file missing");
          }
        }
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("logs: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
