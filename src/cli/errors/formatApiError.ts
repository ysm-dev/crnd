import type { ApiErrorField, ApiErrorPayload } from "./ApiErrorPayload";

type ZodIssue = {
  path: (string | number)[];
  message: string;
  code?: string;
  received?: unknown;
};

type ZodErrorResponse = {
  success: false;
  error: {
    issues: ZodIssue[];
  };
};

type SimpleErrorResponse = {
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

function isZodErrorResponse(body: unknown): body is ZodErrorResponse {
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

function isSimpleErrorResponse(body: unknown): body is SimpleErrorResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const obj = body as Record<string, unknown>;
  return typeof obj.error === "string";
}

function formatZodIssues(issues: ZodIssue[]): ApiErrorField[] {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
    received: issue.received,
  }));
}

function formatErrorsForTty(
  commandName: string,
  errors: ApiErrorField[],
): string {
  const lines = [`${commandName}: validation failed`];
  for (const err of errors) {
    const receivedPart =
      err.received !== undefined
        ? ` (received: ${JSON.stringify(err.received)})`
        : "";
    lines.push(`  ${err.field}: ${err.message}${receivedPart}`);
  }
  return lines.join("\n");
}

type FormatApiErrorResult = {
  payload: ApiErrorPayload;
  message: string;
};

export default async function formatApiError(
  res: ResponseLike,
  commandName: string,
): Promise<FormatApiErrorResult> {
  const code = res.status;
  let body: unknown;

  try {
    body = await res.json();
  } catch {
    // Failed to parse JSON body
    return {
      payload: { status: "error", code },
      message: `${commandName}: error (${code})`,
    };
  }

  // Handle Zod validation errors (from @hono/zod-validator)
  if (isZodErrorResponse(body)) {
    const errors = formatZodIssues(body.error.issues);
    return {
      payload: {
        status: "validation_error",
        code,
        message: "Validation failed",
        errors,
      },
      message: formatErrorsForTty(commandName, errors),
    };
  }

  // Handle simple error responses (from custom route handlers)
  if (isSimpleErrorResponse(body)) {
    const message = body.message || body.error;
    return {
      payload: {
        status: body.error,
        code,
        message,
      },
      message: `${commandName}: ${message}`,
    };
  }

  // Fallback for unknown error formats
  return {
    payload: { status: "error", code },
    message: `${commandName}: error (${code})`,
  };
}
