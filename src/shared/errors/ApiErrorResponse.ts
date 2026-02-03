import type { ErrorCode } from "./ErrorCode";

/**
 * Represents a single validation issue within an error response.
 */
export type ValidationIssue = {
  /** The field path where the error occurred (e.g., "schedule", "env.PATH") */
  path: string;
  /** Human-readable description of what went wrong */
  message: string;
  /** The actual value that was received (for debugging) */
  received?: unknown;
};

/**
 * Standardized API error response format.
 * All API errors follow this structure for consistent error handling.
 *
 * @example
 * // Validation error
 * {
 *   error: {
 *     code: "validation_error",
 *     message: "Invalid datetime at \"runAt\"",
 *     hint: "Use ISO 8601 format: 2026-02-01T10:00:00Z",
 *     details: [
 *       { path: "runAt", message: "Invalid datetime format", received: "2026-02-01" }
 *     ]
 *   }
 * }
 *
 * @example
 * // Not found error
 * {
 *   error: {
 *     code: "job_not_found",
 *     message: "Job \"backup\" was not found",
 *     hint: "List available jobs with: crnd list"
 *   }
 * }
 */
export type ApiErrorResponse = {
  error: {
    /** Machine-readable error code for programmatic handling */
    code: ErrorCode;
    /** Human-readable description of what went wrong */
    message: string;
    /** Actionable suggestion for how to fix the error */
    hint?: string;
    /** The field path where the error occurred (for single-field errors) */
    path?: string;
    /** The actual value that was received (for single-field errors) */
    received?: unknown;
    /** Array of validation issues (for multi-field validation errors) */
    details?: ValidationIssue[];
  };
};

/**
 * Type guard to check if a response body is an ApiErrorResponse
 */
export function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const obj = body as Record<string, unknown>;
  if (typeof obj.error !== "object" || obj.error === null) {
    return false;
  }
  const error = obj.error as Record<string, unknown>;
  return typeof error.code === "string" && typeof error.message === "string";
}
