import { defineCommand } from "citty";
import isOverlapPolicy from "../../shared/jobs/isOverlapPolicy";
import ensureDaemon from "../ensureDaemon";
import formatApiError from "../errors/formatApiError";
import parseRelativeTime from "../utils/parseRelativeTime";
import getCommandArgs from "./getCommandArgs";
import parseEnvArgs from "./parseEnvArgs";

export default function createScheduleCommand() {
  return defineCommand({
    meta: {
      name: "schedule",
      description: "Create or update a job",
    },
    args: {
      name: {
        type: "string",
        alias: "n",
        required: true,
      },
      description: {
        type: "string",
        alias: "d",
      },
      schedule: {
        type: "string",
        alias: "s",
      },
      at: {
        type: "string",
        alias: "a",
      },
      in: {
        type: "string",
        alias: "i",
      },
      timezone: {
        type: "string",
        alias: "z",
      },
      timeout: {
        type: "string",
        alias: "t",
      },
      paused: {
        type: "boolean",
        alias: "p",
      },
      overlap: {
        type: "string",
        alias: "o",
      },
      cwd: {
        type: "string",
        alias: "c",
      },
      env: {
        type: "string",
        alias: "e",
      },
      json: {
        type: "boolean",
        alias: "j",
      },
    },
    async run({ args }) {
      // === All validation happens BEFORE daemon connection ===

      const command = getCommandArgs(process.argv);
      if (command.length === 0) {
        const payload = {
          status: "validation_error",
          code: 400,
          message: "Missing command",
          errors: [
            {
              field: "command",
              message: "Command is required. Provide the command after --",
            },
          ],
        };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: validation failed");
          console.log(
            "  command: Command is required. Provide the command after --",
          );
          console.log(
            "  Example: crnd schedule -n myjob -s '0 * * * *' -- /bin/echo hello",
          );
        }
        process.exitCode = 2;
        return;
      }

      let env: Record<string, string> | undefined;
      try {
        env = parseEnvArgs(args.env);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Invalid format";
        const payload = {
          status: "validation_error",
          code: 400,
          message: "Invalid environment variable",
          errors: [
            {
              field: "env",
              message: `${errorMessage}. Use KEY=VALUE format`,
              received: args.env,
            },
          ],
        };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: validation failed");
          console.log(`  env: ${errorMessage}. Use KEY=VALUE format`);
          console.log("  Example: -e FOO=bar -e BAZ=qux");
        }
        process.exitCode = 2;
        return;
      }

      const timeoutMs = args.timeout ? Number(args.timeout) : undefined;
      if (args.timeout && Number.isNaN(timeoutMs)) {
        const payload = {
          status: "validation_error",
          code: 400,
          message: "Invalid timeout",
          errors: [
            {
              field: "timeout",
              message: "Timeout must be a number (milliseconds)",
              received: args.timeout,
            },
          ],
        };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: validation failed");
          console.log(
            `  timeout: Must be a number (milliseconds), received "${args.timeout}"`,
          );
          console.log("  Example: -t 60000 (for 60 seconds)");
        }
        process.exitCode = 2;
        return;
      }

      const hasSchedule = Boolean(args.schedule);
      const hasRunAt = Boolean(args.at);
      const hasRelative = Boolean(args.in);
      const scheduleCount = [hasSchedule, hasRunAt, hasRelative].filter(
        Boolean,
      ).length;

      if (scheduleCount !== 1) {
        const message =
          scheduleCount === 0
            ? "Missing schedule. Use -s for cron, -a for one-time, or -i for relative time"
            : "Provide only one of -s (schedule), -a (at), or -i (in)";
        const payload = {
          status: "validation_error",
          code: 400,
          message: "Invalid schedule",
          errors: [{ field: "schedule", message }],
        };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: validation failed");
          console.log(`  schedule: ${message}`);
          console.log("  Examples:");
          console.log("    Cron:     -s '0 2 * * *' (daily at 2am)");
          console.log("    One-time: -a '2026-02-01T10:00:00Z'");
          console.log("    Relative: -i '5m' (in 5 minutes)");
        }
        process.exitCode = 2;
        return;
      }

      // Parse relative time to absolute timestamp
      let runAt = args.at;
      if (hasRelative) {
        try {
          runAt = parseRelativeTime(args.in as string);
        } catch (e) {
          const errorMessage =
            e instanceof Error ? e.message : "Invalid relative time format";
          const payload = {
            status: "validation_error",
            code: 400,
            message: "Invalid relative time",
            errors: [
              {
                field: "in",
                message: errorMessage,
                received: args.in,
              },
            ],
          };
          if (args.json) {
            console.log(JSON.stringify(payload));
          } else {
            console.log("schedule: validation failed");
            console.log(`  in: ${errorMessage}`);
            console.log('  Examples: -i 5m, -i 2h, -i 30s, -i "1 hour"');
          }
          process.exitCode = 2;
          return;
        }
      }

      if (args.overlap && !isOverlapPolicy(args.overlap)) {
        const payload = {
          status: "validation_error",
          code: 400,
          message: "Invalid overlap policy",
          errors: [
            {
              field: "overlap",
              message: 'Overlap policy must be "skip" or "allow"',
              received: args.overlap,
            },
          ],
        };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: validation failed");
          console.log(
            `  overlap: Must be "skip" or "allow", received "${args.overlap}"`,
          );
        }
        process.exitCode = 2;
        return;
      }

      const overlapPolicy =
        args.overlap && isOverlapPolicy(args.overlap)
          ? args.overlap
          : undefined;

      // === Daemon connection (with auto-start) ===

      const client = await ensureDaemon();
      if (!client) {
        const payload = { status: "daemon_start_failed", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("schedule: daemon start failed");
        }
        process.exitCode = 3;
        return;
      }

      // === Build request payload ===

      const payload = {
        name: args.name,
        description: args.description,
        command,
        schedule: args.schedule,
        runAt,
        timezone: args.timezone,
        timeoutMs,
        paused: args.paused,
        overlapPolicy,
        cwd: args.cwd,
        env,
      };

      try {
        const res = await client.jobs.$post({ json: payload });
        if (!res.ok) {
          const { payload: errorPayload, message } = await formatApiError(
            res,
            "schedule",
          );
          if (args.json) {
            console.log(JSON.stringify(errorPayload));
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

        console.log(`job: ${data.name} (${data.id})`);
      } catch {
        const errorPayload = { status: "daemon_unreachable", code: 503 };
        if (args.json) {
          console.log(JSON.stringify(errorPayload));
        } else {
          console.log("schedule: daemon unreachable");
          console.log("  Start the daemon with: crnd daemon start");
        }
        process.exitCode = 3;
      }
    },
  });
}
