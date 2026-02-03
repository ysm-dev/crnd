import { ErrorCode } from "../../shared/errors";
import type { ParsedApiError } from "./formatApiError";
import printError from "./printError";

type HandleDaemonErrorOptions = {
  /** Output as JSON instead of human-readable format */
  json?: boolean;
};

/**
 * Handles errors when the daemon cannot be reached or started.
 * Sets the appropriate exit code and prints a helpful error message.
 *
 * @param commandName - The name of the CLI command
 * @param type - The type of daemon error ("unreachable" or "start_failed")
 * @param options - Output options
 *
 * @example
 * const client = await ensureDaemon();
 * if (!client) {
 *   handleDaemonError("delete", "start_failed", { json: args.json });
 *   return;
 * }
 */
function handleDaemonError(
  commandName: string,
  type: "unreachable" | "start_failed",
  options: HandleDaemonErrorOptions = {},
): void {
  const error: ParsedApiError =
    type === "unreachable"
      ? {
          code: ErrorCode.DAEMON_UNREACHABLE,
          statusCode: 503,
          message: "Cannot connect to daemon",
          hint: "Start the daemon with: crnd daemon start",
        }
      : {
          code: ErrorCode.DAEMON_START_FAILED,
          statusCode: 503,
          message: "Failed to start daemon",
          hint: "Check for port conflicts or run: crnd doctor",
        };

  printError(commandName, error, options);
  process.exitCode = 3;
}

/**
 * Handles errors when the daemon is unreachable during an API call.
 * Use this in catch blocks around API calls.
 *
 * @example
 * try {
 *   const res = await client.jobs.$get();
 * } catch {
 *   handleDaemonUnreachable("list", { json: args.json });
 *   return;
 * }
 */
export function handleDaemonUnreachable(
  commandName: string,
  options: HandleDaemonErrorOptions = {},
): void {
  handleDaemonError(commandName, "unreachable", options);
}

/**
 * Handles errors when the daemon fails to start.
 *
 * @example
 * const client = await ensureDaemon();
 * if (!client) {
 *   handleDaemonStartFailed("delete", { json: args.json });
 *   return;
 * }
 */
export function handleDaemonStartFailed(
  commandName: string,
  options: HandleDaemonErrorOptions = {},
): void {
  handleDaemonError(commandName, "start_failed", options);
}
