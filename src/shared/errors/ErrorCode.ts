/**
 * Centralized error codes for the entire application.
 * These codes are used in API responses and CLI output for programmatic error handling.
 *
 * Error code categories:
 * - validation_*: Input validation errors (400)
 * - not_found_*: Resource not found errors (404)
 * - conflict_*: State conflict errors (409)
 * - operation_*: Operation failure errors (500)
 * - auth_*: Authentication/authorization errors (401/403)
 * - daemon_*: Daemon-related errors (503)
 */
export const ErrorCode = {
  // Validation errors (400)
  VALIDATION_ERROR: "validation_error",
  INVALID_INPUT: "invalid_input",
  INVALID_SCHEDULE: "invalid_schedule",
  INVALID_DATETIME: "invalid_datetime",
  INVALID_TIMEZONE: "invalid_timezone",
  INVALID_COMMAND: "invalid_command",
  INVALID_ENV: "invalid_env",
  MISSING_REQUIRED_FIELD: "missing_required_field",
  CONFIRMATION_REQUIRED: "confirmation_required",

  // Resource not found errors (404)
  JOB_NOT_FOUND: "job_not_found",
  RUN_NOT_FOUND: "run_not_found",

  // State conflict errors (409)
  RUN_NOT_RUNNING: "run_not_running",
  JOB_ALREADY_EXISTS: "job_already_exists",
  SCHEDULE_CONFLICT: "schedule_conflict",

  // Operation failure errors (500)
  JOB_NOT_SAVED: "job_not_saved",
  KILL_FAILED: "kill_failed",
  STOP_FAILED: "stop_failed",
  EXPORT_FAILED: "export_failed",
  INTERNAL_ERROR: "internal_error",

  // Input processing errors (400)
  IMPORT_FAILED: "import_failed",

  // Authentication errors (401)
  UNAUTHORIZED: "unauthorized",

  // Daemon errors (503)
  DAEMON_UNREACHABLE: "daemon_unreachable",
  DAEMON_START_FAILED: "daemon_start_failed",
  DAEMON_PORT_UNAVAILABLE: "daemon_port_unavailable",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Maps error codes to their default HTTP status codes
 */
export const ErrorStatusCode: Record<ErrorCode, number> = {
  // Validation errors -> 400
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_SCHEDULE]: 400,
  [ErrorCode.INVALID_DATETIME]: 400,
  [ErrorCode.INVALID_TIMEZONE]: 400,
  [ErrorCode.INVALID_COMMAND]: 400,
  [ErrorCode.INVALID_ENV]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.CONFIRMATION_REQUIRED]: 400,

  // Not found -> 404
  [ErrorCode.JOB_NOT_FOUND]: 404,
  [ErrorCode.RUN_NOT_FOUND]: 404,

  // Conflict -> 409
  [ErrorCode.RUN_NOT_RUNNING]: 409,
  [ErrorCode.JOB_ALREADY_EXISTS]: 409,
  [ErrorCode.SCHEDULE_CONFLICT]: 409,

  // Server errors -> 500
  [ErrorCode.JOB_NOT_SAVED]: 500,
  [ErrorCode.KILL_FAILED]: 500,
  [ErrorCode.STOP_FAILED]: 500,
  [ErrorCode.EXPORT_FAILED]: 500,
  [ErrorCode.INTERNAL_ERROR]: 500,

  // Input processing errors -> 400
  [ErrorCode.IMPORT_FAILED]: 400,

  // Auth -> 401
  [ErrorCode.UNAUTHORIZED]: 401,

  // Daemon -> 503
  [ErrorCode.DAEMON_UNREACHABLE]: 503,
  [ErrorCode.DAEMON_START_FAILED]: 503,
  [ErrorCode.DAEMON_PORT_UNAVAILABLE]: 503,
};
