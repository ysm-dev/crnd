import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import type { z } from "zod";
import { fromZodError } from "zod-validation-error";
import type { ApiErrorResponse, ValidationIssue } from "../../shared/errors";
import { ErrorCode } from "../../shared/errors";

type ValidationTarget =
  | "json"
  | "form"
  | "query"
  | "param"
  | "header"
  | "cookie";

/**
 * Normalizes a path array to only contain strings and numbers.
 */
function normalizePath(path: PropertyKey[]): (string | number)[] {
  return path.filter(
    (key): key is string | number =>
      typeof key === "string" || typeof key === "number",
  );
}

/**
 * Extracts the received value from input data based on a path array.
 */
function extractReceived(
  input: unknown,
  path: PropertyKey[],
): unknown | undefined {
  let current: unknown = input;
  for (const key of path) {
    if (
      current &&
      typeof current === "object" &&
      (typeof key === "string" || typeof key === "number")
    ) {
      current = (current as Record<string | number, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Formats Zod validation errors into the standardized API error response format.
 * Uses `zod-validation-error` for user-friendly message formatting.
 */
function formatValidationError(
  zodError: z.ZodError,
  input: unknown,
): ApiErrorResponse {
  // Use zod-validation-error for user-friendly message formatting
  const formatted = fromZodError(zodError, {
    prefix: null,
    includePath: true,
  });

  // Convert Zod issues to our ValidationIssue format
  const details: ValidationIssue[] = zodError.issues.map((issue) => {
    const normalizedPath = normalizePath(issue.path);
    return {
      path: normalizedPath.length > 0 ? normalizedPath.join(".") : "(root)",
      message: issue.message,
      received: extractReceived(input, issue.path),
    };
  });

  return {
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: formatted.message,
      hint: "Check the field values and try again",
      details,
    },
  };
}

/**
 * Creates a zValidator with a custom hook that returns standardized error responses.
 *
 * Features:
 * - Uses `zod-validation-error` for user-friendly error messages
 * - Includes the received value in each validation error for debugging
 * - Returns consistent error format matching ApiErrorResponse type
 *
 * @example
 * app.post('/jobs', createZValidator('json', jobSchema), (c) => {
 *   const data = c.req.valid('json');
 *   // data is validated and typed
 * });
 */
export default function createZValidator<
  Target extends ValidationTarget,
  Schema extends z.ZodTypeAny,
>(target: Target, schema: Schema) {
  return zValidator(target, schema, (result, c: Context) => {
    if (!result.success) {
      // Cast to z.ZodError to ensure compatibility with zod-validation-error
      const zodError = result.error as unknown as z.ZodError;
      const errorResponse = formatValidationError(zodError, result.data);
      return c.json(errorResponse, 400);
    }
  });
}
