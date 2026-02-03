import { type ErrorCode, isApiErrorResponse } from "../../shared/errors";

/**
 * Parsed error payload for CLI output and JSON responses.
 */
export type ParsedApiError = {
  /** Machine-readable error code */
  code: ErrorCode | string;
  /** HTTP status code */
  statusCode: number;
  /** Human-readable error message */
  message: string;
  /** Actionable suggestion for how to fix the error */
  hint?: string;
  /** Array of validation issues (for multi-field errors) */
  details?: Array<{
    path: string;
    message: string;
    received?: unknown;
  }>;
};

/**
 * Legacy Zod error response format (for backward compatibility).
 */
type LegacyZodErrorResponse = {
  success: false;
  error: {
    issues: Array<{
      path: (string | number)[];
      message: string;
      code?: string;
      received?: unknown;
    }>;
  };
};

/**
 * Legacy simple error response format (for backward compatibility).
 */
type LegacySimpleErrorResponse = {
  error: string;
  message?: string;
};

/**
 * Minimal response interface that works with both standard Response
 * and Hono's ClientResponse types.
 */
type ResponseLike = {
  status: number;
  json: () => Promise<unknown>;
};

function isLegacyZodErrorResponse(
  body: unknown,
): body is LegacyZodErrorResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const obj = body as Record<string, unknown>;
  return (
    obj.success === false &&
    typeof obj.error === "object" &&
    obj.error !== null &&
    Array.isArray((obj.error as Record<string, unknown>).issues)
  );
}

function isLegacySimpleErrorResponse(
  body: unknown,
): body is LegacySimpleErrorResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const obj = body as Record<string, unknown>;
  return typeof obj.error === "string";
}

/**
 * Formats a parsed error for TTY output with verbose context.
 */
function formatErrorForTty(commandName: string, error: ParsedApiError): string {
  const lines: string[] = [`${commandName}: ${error.message}`];

  if (error.hint) {
    lines.push(`  ${error.hint}`);
  }

  if (error.details && error.details.length > 0) {
    for (const issue of error.details) {
      const receivedPart =
        issue.received !== undefined
          ? ` (received: ${JSON.stringify(issue.received)})`
          : "";
      lines.push(`  ${issue.path}: ${issue.message}${receivedPart}`);
    }
  }

  return lines.join("\n");
}

/**
 * Parses an API error response into a structured format.
 * Handles both the new standardized format and legacy formats for backward compatibility.
 */
async function parseApiError(res: ResponseLike): Promise<ParsedApiError> {
  const statusCode = res.status;
  let body: unknown;

  try {
    body = await res.json();
  } catch {
    // Failed to parse JSON body
    return {
      code: "error",
      statusCode,
      message: `Request failed with status ${statusCode}`,
      hint: "Check if the daemon is running correctly",
    };
  }

  // Handle new standardized ApiErrorResponse format
  if (isApiErrorResponse(body)) {
    const { error } = body;
    return {
      code: error.code,
      statusCode,
      message: error.message,
      hint: error.hint,
      details: error.details,
    };
  }

  // Handle legacy Zod validation error format
  if (isLegacyZodErrorResponse(body)) {
    const details = body.error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
      message: issue.message,
      received: issue.received,
    }));

    return {
      code: "validation_error",
      statusCode,
      message: "Validation failed",
      hint: "Check the field values and try again",
      details,
    };
  }

  // Handle legacy simple error format
  if (isLegacySimpleErrorResponse(body)) {
    return {
      code: body.error,
      statusCode,
      message: body.message ?? body.error.replace(/_/g, " "),
      hint: getDefaultHint(body.error),
    };
  }

  // Fallback for unknown error formats
  return {
    code: "error",
    statusCode,
    message: `Request failed with status ${statusCode}`,
    hint: "Check daemon logs for details: crnd daemon logs",
  };
}

/**
 * Returns a default hint for known legacy error codes.
 */
function getDefaultHint(errorCode: string): string | undefined {
  const hints: Record<string, string> = {
    job_not_found: "List available jobs with: crnd list",
    run_not_found: "List job runs with: crnd runs <job-name>",
    run_not_running:
      "The job may have already completed. Check status with: crnd show <job-name>",
    job_not_saved: "Check daemon logs for details: crnd daemon logs",
    kill_failed: "Check job status with: crnd show <job-name>",
    stop_failed: "Check job status with: crnd show <job-name>",
    unauthorized: "Restart the daemon to generate a new token",
  };
  return hints[errorCode];
}

type FormatApiErrorResult = {
  payload: ParsedApiError;
  message: string;
};

/**
 * Formats an API error response for CLI output.
 * Returns both a structured payload (for JSON output) and a formatted message (for TTY output).
 *
 * @param res - The response object from the API call
 * @param commandName - The name of the CLI command (for error messages)
 * @returns An object with both the payload and formatted message
 *
 * @example
 * const res = await client.jobs[":name"].$delete({ param: { name } });
 * if (!res.ok) {
 *   const { payload, message } = await formatApiError(res, "delete");
 *   if (args.json) {
 *     console.log(JSON.stringify(payload));
 *   } else {
 *     console.log(message);
 *   }
 * }
 */
export default async function formatApiError(
  res: ResponseLike,
  commandName: string,
): Promise<FormatApiErrorResult> {
  const payload = await parseApiError(res);
  const message = formatErrorForTty(commandName, payload);
  return { payload, message };
}
