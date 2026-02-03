import type { ApiErrorResponse } from "../../../shared/errors";
import { ErrorCode } from "../../../shared/errors";

/**
 * Creates a standardized "job not found" error response.
 */
export function jobNotFoundResponse(jobName: string): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.JOB_NOT_FOUND,
      message: `Job "${jobName}" was not found`,
      hint: "List available jobs with: crnd list",
    },
  };
}

/**
 * Creates a standardized "run not found" error response.
 */
export function runNotFoundResponse(runId: string): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.RUN_NOT_FOUND,
      message: `Run "${runId}" was not found`,
      hint: "List job runs with: crnd runs <job-name>",
    },
  };
}

/**
 * Creates a standardized "run not running" error response.
 */
export function runNotRunningResponse(jobName: string): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.RUN_NOT_RUNNING,
      message: `Cannot stop job "${jobName}": no active run`,
      hint: "The job may have already completed. Check status with: crnd show <job-name>",
    },
  };
}

/**
 * Creates a standardized "job not saved" error response.
 */
export function jobNotSavedResponse(jobName: string): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.JOB_NOT_SAVED,
      message: `Failed to save job "${jobName}"`,
      hint: "Check daemon logs for details: crnd daemon logs",
    },
  };
}

/**
 * Creates a standardized "kill failed" error response.
 */
export function killFailedResponse(jobName: string): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.KILL_FAILED,
      message: `Failed to kill job "${jobName}": process may have already exited`,
      hint: "Check job status with: crnd show <job-name>",
    },
  };
}

/**
 * Creates a standardized "stop failed" error response.
 */
export function stopFailedResponse(jobName: string): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.STOP_FAILED,
      message: `Failed to stop job "${jobName}": process may have already exited`,
      hint: "Check job status with: crnd show <job-name>",
    },
  };
}

/**
 * Creates a standardized "import failed" error response.
 */
export function importFailedResponse(reason: string): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.IMPORT_FAILED,
      message: `Import failed: ${reason}`,
      hint: "Check the jobs.toml file format and try again",
    },
  };
}

/**
 * Creates a standardized "unauthorized" error response.
 */
export function unauthorizedResponse(): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.UNAUTHORIZED,
      message: "Authentication required",
      hint: "Ensure the daemon is running and you have valid credentials",
    },
  };
}
