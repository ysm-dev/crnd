import type { ParsedApiError } from "./formatApiError";

type PrintErrorOptions = {
  /** Output as JSON instead of human-readable format */
  json?: boolean;
};

/**
 * Prints an error to the console in either JSON or human-readable format.
 *
 * @param commandName - The name of the CLI command (for error messages)
 * @param error - The parsed error object
 * @param options - Output options
 *
 * @example
 * printError("delete", {
 *   code: "job_not_found",
 *   statusCode: 404,
 *   message: 'Job "backup" was not found',
 *   hint: "List available jobs with: crnd list"
 * });
 * // Output (TTY): delete: Job "backup" was not found
 * //                 List available jobs with: crnd list
 */
export default function printError(
  commandName: string,
  error: ParsedApiError,
  options: PrintErrorOptions = {},
): void {
  if (options.json) {
    console.log(JSON.stringify(error));
    return;
  }

  // Human-readable format
  console.log(`${commandName}: ${error.message}`);

  if (error.hint) {
    console.log(`  ${error.hint}`);
  }

  if (error.details && error.details.length > 0) {
    for (const issue of error.details) {
      const receivedPart =
        issue.received !== undefined
          ? ` (received: ${JSON.stringify(issue.received)})`
          : "";
      console.log(`  ${issue.path}: ${issue.message}${receivedPart}`);
    }
  }
}
