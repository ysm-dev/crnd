import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";

export default function createRunsCommand() {
  return defineCommand({
    meta: {
      name: "runs",
      description: "List runs for a job",
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        required: true,
      },
      limit: {
        type: "string",
        alias: "l",
      },
      json: {
        type: "boolean",
        alias: "j",
      },
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

      let limit: number | null = null;
      if (args.limit) {
        const parsed = Number(args.limit);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          const payload = { status: "invalid_limit" };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("runs: invalid limit");
          }
          process.exitCode = 2;
          return;
        }
        limit = parsed;
      }

      try {
        const res = await client.jobs[":name"].runs.$get({
          param: { name: args.name },
          query: limit ? { limit: String(limit) } : {},
        });
        if (res.status === 404) {
          const payload = { status: "not_found" };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("runs: job not found");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const payload = { status: "error", code: res.status };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log(`runs: error (${res.status})`);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        if (data.length === 0) {
          console.log("runs: none");
          return;
        }

        for (const run of data) {
          console.log(`${run.id} ${run.status} ${run.startedAt ?? ""}`.trim());
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
    },
  });
}
