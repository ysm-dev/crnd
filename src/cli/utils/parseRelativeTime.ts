import type { StringValue } from "ms";
import ms from "ms";

// Pattern matching ms library's supported formats
const MS_PATTERN =
  /^(-?(?:\d+)?\.?\d+)\s*(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

/**
 * Type guard to check if a string matches the ms library's expected format.
 */
function isValidMsFormat(value: string): value is StringValue {
  return value.length <= 100 && MS_PATTERN.test(value);
}

/**
 * Parses a relative time string (e.g., "5m", "2h", "30s") and returns
 * an ISO 8601 timestamp representing that duration from now.
 *
 * Supported formats (via ms library):
 * - "100" -> 100 milliseconds
 * - "1s", "1 second", "1 seconds" -> 1 second
 * - "1m", "1 minute", "1 minutes" -> 1 minute
 * - "1h", "1 hour", "1 hours" -> 1 hour
 * - "1d", "1 day", "1 days" -> 1 day
 * - "1w", "1 week", "1 weeks" -> 1 week
 * - "1y", "1 year", "1 years" -> 1 year
 *
 * @param input - The relative time string
 * @returns ISO 8601 timestamp string
 * @throws Error if the input cannot be parsed
 */
export default function parseRelativeTime(input: string): string {
  if (!isValidMsFormat(input)) {
    throw new Error(
      `Invalid relative time format: "${input}". Use formats like "5m", "2h", "30s", "1d"`,
    );
  }

  const milliseconds = ms(input);

  if (milliseconds <= 0) {
    throw new Error(
      `Relative time must be positive: "${input}" resolves to ${milliseconds}ms`,
    );
  }

  const runAt = new Date(Date.now() + milliseconds);
  return runAt.toISOString();
}
