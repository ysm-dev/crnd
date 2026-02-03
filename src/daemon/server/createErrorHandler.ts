import type { Context, ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  type ApiErrorResponse,
  ErrorCode,
  isAppError,
} from "../../shared/errors";

/**
 * Creates a global error handler for the Hono app.
 *
 * Features:
 * - Converts AppError instances to standardized API responses
 * - Catches unhandled exceptions and returns safe error responses
 * - Logs unexpected errors via the provided logger
 *
 * @example
 * const app = new Hono();
 * app.onError(createErrorHandler(logger));
 */
export default function createErrorHandler(logger?: {
  error: (data: Record<string, unknown>) => void;
}): ErrorHandler {
  return (err: Error, c: Context) => {
    // Handle known application errors
    if (isAppError(err)) {
      return c.json(err.toJSON(), err.statusCode as ContentfulStatusCode);
    }

    // Log unexpected errors
    if (logger) {
      logger.error({
        event: "unhandled_error",
        error: err.message,
        stack: err.stack,
      });
    }

    // Return safe error response for unexpected errors
    const response: ApiErrorResponse = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: "An unexpected error occurred",
        hint: "Check daemon logs for details: crnd daemon logs",
      },
    };

    return c.json(response, 500);
  };
}
