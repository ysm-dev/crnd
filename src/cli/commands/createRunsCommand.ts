import { defineCommand } from "citty";
import ensureDaemon from "../ensureDaemon";
import formatApiError from "../errors/formatApiError";

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
        description: "Job name",
        required: true,
      },
      limit: {
        type: "string",
        alias: "l",
        description: "Max runs to return",
      },
      json: {
        type: "boolean",
        alias: "j",
        description: "Output in JSON format",
      },
    },
    async run({ args }) {
      // Validate limit before daemon connection
      let limit: number | null = null;
      if (args.limit) {
        const parsed = Number(args.limit);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          const payload = {
            status: "validation_error",
            code: 400,
            message: "Invalid limit",
            errors: [
              {
                field: "limit",
                message: "Limit must be a positive number",
                received: args.limit,
              },
            ],
          };
          if (args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("runs: validation failed");
            console.log(
              `  limit: Must be a positive number, received "${args.limit}"`,
            );
          }
          process.exitCode = 2;
          return;
        }
        limit = parsed;
      }

      const client = await ensureDaemon();
      if (!client) {
        const payload = { status: "daemon_start_failed", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("runs: daemon start failed");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs[":name"].runs.$get({
          param: { name: args.name },
          query: limit ? { limit: String(limit) } : {},
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
            console.log(`runs: job "${args.name}" not found`);
            console.log("  List available jobs with: crnd list");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "runs");
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
          console.log("runs: none");
          return;
        }

        for (const run of data) {
          console.log(`${run.id} ${run.status} ${run.startedAt ?? ""}`.trim());
        }
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("runs: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
