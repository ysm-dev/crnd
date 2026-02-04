import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";
import ensureDaemon from "../ensureDaemon";
import formatApiError from "../errors/formatApiError";

export default function createStatusCommand() {
  return defineCommand({
    meta: {
      name: "status",
      description: "Show daemon status",
    },
    args: {
      name: {
        type: "string",
        alias: "n",
      },
      json: {
        type: "boolean",
        alias: "j",
      },
    },
    async run({ args }) {
      if (args.name) {
        const client = await ensureDaemon();
        if (!client) {
          const payload = { status: "daemon_start_failed", code: 503 };
          if (args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("status: daemon start failed");
          }
          process.exitCode = 3;
          return;
        }

        try {
          const jobRes = await client.jobs[":name"].$get({
            param: { name: args.name },
          });
          if (jobRes.status === 404) {
            const payload = {
              status: "not_found",
              code: 404,
              message: `Job "${args.name}" not found`,
            };
            if (args.json) {
              console.log(JSON.stringify(payload));
            } else {
              console.log(`status: job "${args.name}" not found`);
              console.log("  List available jobs with: crnd list");
            }
            process.exitCode = 1;
            return;
          }

          if (!jobRes.ok) {
            const { payload, message } = await formatApiError(jobRes, "status");
            if (args.json) {
              console.log(JSON.stringify(payload));
            } else {
              console.log(message);
            }
            process.exitCode = 1;
            return;
          }

          const job = await jobRes.json();
          const runsRes = await client.jobs[":name"].runs.$get({
            param: { name: args.name },
            query: { limit: "1" },
          });

          const latestRun = runsRes.ok ? (await runsRes.json())[0] : null;
          const payload = {
            job,
            latestRun,
          };

          if (args.json) {
            console.log(JSON.stringify(payload));
            return;
          }

          console.log(`job: ${job.name} (${job.id})`);
          console.log(`paused: ${job.paused}`);
          if (job.nextRunAt) {
            console.log(`nextRunAt: ${job.nextRunAt}`);
          }
          if (latestRun) {
            console.log(
              `lastRun: ${latestRun.status} ${latestRun.startedAt ?? ""}`.trim(),
            );
          }
          return;
        } catch {
          const payload = { status: "daemon_unreachable", code: 503 };
          if (args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("status: daemon unreachable");
            console.log("  Start the daemon with: crnd daemon start");
          }
          process.exitCode = 3;
          return;
        }
      }

      const client = createRpcClient();
      if (!client) {
        const payload = { status: "daemon_stopped", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: stopped");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.health.$get();
        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "status");
          if (args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(message);
          }
          process.exitCode = 3;
          return;
        }

        const data = await res.json();
        if (args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        console.log(`daemon: running (pid ${data.pid})`);
        console.log(`started: ${data.startedAt}`);
        console.log(`version: ${data.version}`);
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("status: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
