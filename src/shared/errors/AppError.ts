import type { ApiErrorResponse, ValidationIssue } from "./ApiErrorResponse";
import { type ErrorCode, ErrorStatusCode } from "./ErrorCode";

type AppErrorOptions = {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable description of what went wrong */
  message: string;
  /** HTTP status code (defaults based on error code) */
  statusCode?: number;
  /** Actionable suggestion for how to fix the error */
  hint?: string;
  /** The field path where the error occurred */
  path?: string;
  /** The actual value that was received */
  received?: unknown;
  /** Array of validation issues (for multi-field errors) */
  details?: ValidationIssue[];
  /** The original error that caused this error */
  cause?: Error;
};

/**
 * Base error class for all application errors.
 *
 * Provides a consistent error structure with:
 * - `code`: Machine-readable error code for programmatic handling
 * - `message`: Human-readable description of what went wrong
 * - `statusCode`: HTTP status code for API responses
 * - `hint`: Actionable suggestion for how to fix the error
 * - `path`: The field where the error occurred (for validation errors)
 * - `received`: The actual value that was received
 * - `details`: Array of validation issues (for multi-field errors)
 *
 * @example
 * throw new AppError({
 *   code: ErrorCode.JOB_NOT_FOUND,
 *   message: 'Job "backup" was not found',
 *   hint: 'List available jobs with: crnd list'
 * });
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly hint?: string;
  readonly path?: string;
  readonly received?: unknown;
  readonly details?: ValidationIssue[];

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? ErrorStatusCode[options.code];
    this.hint = options.hint;
    this.path = options.path;
    this.received = options.received;
    this.details = options.details;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error to a standardized API response format
   */
  toJSON(): ApiErrorResponse {
    const error: ApiErrorResponse["error"] = {
      code: this.code,
      message: this.message,
    };

    if (this.hint !== undefined) {
      error.hint = this.hint;
    }
    if (this.path !== undefined) {
      error.path = this.path;
    }
    if (this.received !== undefined) {
      error.received = this.received;
    }
    if (this.details !== undefined && this.details.length > 0) {
      error.details = this.details;
    }

    return { error };
  }

  /**
   * Creates a formatted string for CLI output
   */
  toCliString(commandName: string): string {
    const lines: string[] = [`${commandName}: ${this.message}`];

    if (this.hint) {
      lines.push(`  ${this.hint}`);
    }

    if (this.details && this.details.length > 0) {
      for (const issue of this.details) {
        const receivedPart =
          issue.received !== undefined
            ? ` (received: ${JSON.stringify(issue.received)})`
            : "";
        lines.push(`  ${issue.path}: ${issue.message}${receivedPart}`);
      }
    } else if (this.path) {
      const receivedPart =
        this.received !== undefined
          ? ` (received: ${JSON.stringify(this.received)})`
          : "";
      lines.push(`  ${this.path}: ${this.message}${receivedPart}`);
    }

    return lines.join("\n");
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
