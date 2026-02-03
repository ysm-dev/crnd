import { defineCommand } from "citty";
import ensureDaemon from "../ensureDaemon";
import formatApiError from "../errors/formatApiError";

export default function createDeleteCommand() {
  return defineCommand({
    meta: {
      name: "delete",
      description: "Delete a job",
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        required: true,
      },
      force: {
        type: "boolean",
        alias: "f",
      },
      json: {
        type: "boolean",
        alias: "j",
      },
    },
    async run({ args }) {
      if (!args.force) {
        const payload = {
          status: "validation_error",
          code: 400,
          message: "Confirmation required",
          errors: [
            {
              field: "force",
              message: "Delete requires --force/-f flag to confirm",
            },
          ],
        };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("delete: confirmation required");
          console.log("  Use --force/-f to confirm deletion");
          console.log(`  Example: crnd delete -n ${args.name} --force`);
        }
        process.exitCode = 2;
        return;
      }

      const client = await ensureDaemon();
      if (!client) {
        const payload = { status: "daemon_start_failed", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("delete: daemon start failed");
        }
        process.exitCode = 3;
        return;
      }

      try {
        const res = await client.jobs[":name"].$delete({
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
            console.log(`delete: job "${args.name}" not found`);
            console.log("  List available jobs with: crnd list");
          }
          process.exitCode = 1;
          return;
        }

        if (!res.ok) {
          const { payload, message } = await formatApiError(res, "delete");
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

        console.log(`delete: removed (${data.jobId})`);
      } catch {
        const payload = { status: "daemon_unreachable", code: 503 };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("delete: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
