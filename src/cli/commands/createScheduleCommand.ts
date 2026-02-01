import { defineCommand } from "citty";
import createRpcClient from "../../shared/rpc/createRpcClient";
import isOverlapPolicy from "../../shared/jobs/isOverlapPolicy";
import getCommandArgs from "./getCommandArgs";
import parseEnvArgs from "./parseEnvArgs";

export default function createScheduleCommand() {
  return defineCommand({
    meta: {
      name: "schedule",
      description: "Create or update a job"
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        required: true
      },
      description: {
        type: "string",
        alias: "d"
      },
      schedule: {
        type: "string",
        alias: "s"
      },
      at: {
        type: "string",
        alias: "a"
      },
      timezone: {
        type: "string",
        alias: "z"
      },
      timeout: {
        type: "string",
        alias: "t"
      },
      paused: {
        type: "boolean",
        alias: "p"
      },
      overlap: {
        type: "string",
        alias: "o"
      },
      cwd: {
        type: "string",
        alias: "c"
      },
      env: {
        type: "string",
        alias: "e"
      },
      json: {
        type: "boolean",
        alias: "j"
      }
    },
    async run({ args }) {
      const command = getCommandArgs(process.argv);
      if (command.length === 0) {
        const payload = { status: "missing_command" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: missing command after --");
        }
        process.exitCode = 2;
        return;
      }

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

      let env: Record<string, string> | undefined;
      try {
        env = parseEnvArgs(args.env);
      } catch {
        const payload = { status: "invalid_env" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: invalid env");
        }
        process.exitCode = 2;
        return;
      }
      const timeoutMs = args.timeout ? Number(args.timeout) : undefined;
      if (args.timeout && Number.isNaN(timeoutMs)) {
        const payload = { status: "invalid_timeout" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: invalid timeout");
        }
        process.exitCode = 2;
        return;
      }

      const hasSchedule = Boolean(args.schedule);
      const hasRunAt = Boolean(args.at);
      if (hasSchedule === hasRunAt) {
        const payload = { status: "invalid_schedule" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: provide schedule or at");
        }
        process.exitCode = 2;
        return;
      }

      if (args.overlap && !isOverlapPolicy(args.overlap)) {
        const payload = { status: "invalid_overlap" };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: invalid overlap policy");
        }
        process.exitCode = 2;
        return;
      }

      const overlapPolicy = args.overlap && isOverlapPolicy(args.overlap) ? args.overlap : undefined;

      const payload = {
        name: args.name,
        description: args.description,
        command,
        schedule: args.schedule,
        runAt: args.at,
        timezone: args.timezone,
        timeoutMs,
        paused: args.paused,
        overlapPolicy,
        cwd: args.cwd,
        env
      };

      try {
        const res = await client.jobs.$post({ json: payload });
        if (!res.ok) {
          const errorPayload = { status: "error", code: res.status };
          if (!process.stdout.isTTY || args.json) {
            console.log(JSON.stringify(errorPayload));
          } else {
            console.log(`schedule: error (${res.status})`);
          }
          process.exitCode = 1;
          return;
        }

        const data = await res.json();
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(data));
          return;
        }

        console.log(`job: ${data.name} (${data.id})`);
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
