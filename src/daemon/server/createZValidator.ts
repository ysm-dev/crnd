import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import type { z } from "zod";

type ValidationTarget =
  | "json"
  | "form"
  | "query"
  | "param"
  | "header"
  | "cookie";

type ZodIssueWithInput = {
  path: (string | number)[];
  message: string;
  code: string;
  received?: unknown;
};

type FormattedError = {
  success: false;
  error: {
    issues: ZodIssueWithInput[];
  };
};

function formatZodError(issues: z.ZodIssue[], input: unknown): FormattedError {
  const formattedIssues = issues.map((issue) => {
    // Extract the received value from the input based on the path
    let received: unknown = input;
    for (const key of issue.path) {
      if (
        received &&
        typeof received === "object" &&
        (typeof key === "string" || typeof key === "number")
      ) {
        received = (received as Record<string | number, unknown>)[key];
      } else {
        received = undefined;
        break;
      }
    }

    // Convert path to string/number only (filter out symbols)
    const normalizedPath = issue.path.filter(
      (k): k is string | number =>
        typeof k === "string" || typeof k === "number",
    );

    return {
      path: normalizedPath,
      message: issue.message,
      code: issue.code,
      received,
    };
  });

  return {
    success: false,
    error: { issues: formattedIssues },
  };
}

/**
 * Creates a zValidator with a custom hook that includes the received
 * value in each validation error issue. This makes error messages more
 * informative for debugging.
 */
export default function createZValidator<
  Target extends ValidationTarget,
  Schema extends z.ZodTypeAny,
>(target: Target, schema: Schema) {
  return zValidator(target, schema, (result, c: Context) => {
    if (!result.success) {
      const formatted = formatZodError(result.error.issues, result.data);
      return c.json(formatted, 400);
    }
  });
}
