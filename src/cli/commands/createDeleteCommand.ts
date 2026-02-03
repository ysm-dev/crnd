import { defineCommand } from "citty";
import { ErrorCode } from "../../shared/errors";
import ensureDaemon from "../ensureDaemon";
import {
  formatApiError,
  handleDaemonStartFailed,
  handleDaemonUnreachable,
  printError,
} from "../errors";

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
        printError(
          "delete",
          {
            code: ErrorCode.CONFIRMATION_REQUIRED,
            statusCode: 400,
            message: "Confirmation required to delete job",
            hint: `Use --force/-f to confirm: crnd delete -n ${args.name} --force`,
          },
          { json: args.json },
        );
        process.exitCode = 2;
        return;
      }

      const client = await ensureDaemon();
      if (!client) {
        handleDaemonStartFailed("delete", { json: args.json });
        return;
      }

      try {
        const res = await client.jobs[":name"].$delete({
          param: { name: args.name },
        });

        if (!res.ok) {
          const { payload } = await formatApiError(res, "delete");
          printError("delete", payload, { json: args.json });
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
        handleDaemonUnreachable("delete", { json: args.json });
      }
    },
  });
}
