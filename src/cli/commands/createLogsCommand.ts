import { readFileSync } from "node:fs";
import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";

export default function createLogsCommand() {
  return defineCommand({
    meta: {
      name: "logs",
      description: "Show latest run logs for a job"
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        required: true
      },
      show: {
        type: "boolean",
        alias: "s"
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
        const res = await client.jobs[":name"].runs.$get({
          param: { name: args.name },
          query: { limit: "1" }
        });
        if (res.status === 404) {
          const payload = { status: "not_found" };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("logs: job not found");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const payload = { status: "error", code: res.status };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`logs: error (${res.status})`);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          const payload = { status: "no_runs" };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("logs: no runs");
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
            console.log("logs: stdout missing");
          }
        }
        if (run.stderrPath) {
          try {
            console.log("-- stderr --");
            console.log(readFileSync(run.stderrPath, "utf-8"));
          } catch {
            console.log("logs: stderr missing");
          }
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
    }
  });
}
