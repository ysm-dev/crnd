import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";

export default function createStatusCommand() {
  return defineCommand({
    meta: {
      name: "status",
      description: "Show daemon status"
    },
    args: {
      name: {
        type: "string",
        alias: "n"
      },
      json: {
        type: "boolean",
        alias: "j"
      }
    },
    async run({ args }) {
      if (args.name) {
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
          const jobRes = await client.jobs[":name"].$get({ param: { name: args.name } });
          if (jobRes.status === 404) {
            const payload = { status: "not_found" };
            if (!process.stdout.isTTY || args.json) {
              console.log(JSON.stringify(payload));
            } else {
              console.log("status: job not found");
            }
            process.exitCode = 1;
            return;
          }

          if (!jobRes.ok) {
            const payload = { status: "error", code: jobRes.status };
            if (!process.stdout.isTTY || args.json) {
              console.log(JSON.stringify(payload));
            } else {
              console.log(`status: error (${jobRes.status})`);
            }
            process.exitCode = 1;
            return;
          }

          const job = await jobRes.json();
          const runsRes = await client.jobs[":name"].runs.$get({
            param: { name: args.name },
            query: { limit: "1" }
          });

          const latestRun = runsRes.ok ? (await runsRes.json())[0] : null;
          const payload = {
            job,
            latestRun
          };

          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
            return;
          }

          console.log(`job: ${job.name} (${job.id})`);
          console.log(`paused: ${job.paused}`);
          if (job.nextRunAt) {
            console.log(`nextRunAt: ${job.nextRunAt}`);
          }
          if (latestRun) {
            console.log(`lastRun: ${latestRun.status} ${latestRun.startedAt ?? ""}`.trim());
          }
          return;
        } catch {
          const payload = { status: "unreachable" };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("daemon: unreachable");
          }
          process.exitCode = 3;
          return;
        }
      }

      const client = createRpcClient();
      if (!client) {
        const payload = { status: "stopped" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: stopped");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.health.$get();
        if (!res.ok) {
          const payload = { status: "unreachable", code: res.status };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`daemon: unreachable (${res.status})`);
          }
          process.exitCode = 3;
          return;
        }

        const data = await res.json();
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        console.log(`daemon: running (pid ${data.pid})`);
        console.log(`started: ${data.startedAt}`);
        console.log(`version: ${data.version}`);
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
