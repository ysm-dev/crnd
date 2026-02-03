import { describe, expect, test } from "bun:test";
import formatApiError from "../../src/cli/errors/formatApiError";

function createMockResponse(status: number, body: unknown) {
  return {
    status,
    json: async () => body,
  };
}

describe("formatApiError", () => {
  test("handles new standardized API error format", async () => {
    const res = createMockResponse(400, {
      error: {
        code: "validation_error",
        message: 'Invalid datetime at "runAt"',
        hint: "Use ISO 8601 format: 2026-02-01T10:00:00Z",
        details: [
          {
            path: "runAt",
            message:
              "Invalid datetime. Use ISO 8601 with timezone (e.g., 2026-02-01T10:00:00Z)",
            received: "2026-02-01T22:38:23",
          },
        ],
      },
    });

    const result = await formatApiError(res, "schedule");

    expect(result.payload).toEqual({
      code: "validation_error",
      statusCode: 400,
      message: 'Invalid datetime at "runAt"',
      hint: "Use ISO 8601 format: 2026-02-01T10:00:00Z",
      details: [
        {
          path: "runAt",
          message:
            "Invalid datetime. Use ISO 8601 with timezone (e.g., 2026-02-01T10:00:00Z)",
          received: "2026-02-01T22:38:23",
        },
      ],
    });
    expect(result.message).toContain('schedule: Invalid datetime at "runAt"');
    expect(result.message).toContain(
      "Use ISO 8601 format: 2026-02-01T10:00:00Z",
    );
  });

  test("handles legacy Zod validation errors", async () => {
    const res = createMockResponse(400, {
      success: false,
      error: {
        issues: [
          {
            path: ["runAt"],
            message:
              "Invalid datetime. Use ISO 8601 with timezone (e.g., 2026-02-01T10:00:00Z)",
            received: "2026-02-01T22:38:23",
          },
        ],
      },
    });

    const result = await formatApiError(res, "schedule");

    expect(result.payload.code).toBe("validation_error");
    expect(result.payload.statusCode).toBe(400);
    expect(result.payload.message).toBe("Validation failed");
    expect(result.payload.details).toHaveLength(1);
    expect(result.payload.details?.[0]).toEqual({
      path: "runAt",
      message:
        "Invalid datetime. Use ISO 8601 with timezone (e.g., 2026-02-01T10:00:00Z)",
      received: "2026-02-01T22:38:23",
    });
    expect(result.message).toContain("schedule: Validation failed");
    expect(result.message).toContain(
      'runAt: Invalid datetime. Use ISO 8601 with timezone (e.g., 2026-02-01T10:00:00Z) (received: "2026-02-01T22:38:23")',
    );
  });

  test("handles multiple Zod validation errors", async () => {
    const res = createMockResponse(400, {
      success: false,
      error: {
        issues: [
          {
            path: ["name"],
            message: "Required",
          },
          {
            path: ["schedule"],
            message: "Invalid cron expression",
            received: "bad",
          },
        ],
      },
    });

    const result = await formatApiError(res, "schedule");

    expect(result.payload.details).toHaveLength(2);
    expect(result.payload.details?.[0]).toEqual({
      path: "name",
      message: "Required",
      received: undefined,
    });
    expect(result.payload.details?.[1]).toEqual({
      path: "schedule",
      message: "Invalid cron expression",
      received: "bad",
    });
    expect(result.message).toContain("schedule: Validation failed");
    expect(result.message).toContain("name: Required");
    expect(result.message).toContain(
      'schedule: Invalid cron expression (received: "bad")',
    );
  });

  test("handles nested field paths", async () => {
    const res = createMockResponse(400, {
      success: false,
      error: {
        issues: [
          {
            path: ["command", 0],
            message: "String expected",
            received: 123,
          },
        ],
      },
    });

    const result = await formatApiError(res, "schedule");

    expect(result.payload.details?.[0].path).toBe("command.0");
    expect(result.message).toContain(
      "command.0: String expected (received: 123)",
    );
  });

  test("handles empty path as (root)", async () => {
    const res = createMockResponse(400, {
      success: false,
      error: {
        issues: [
          {
            path: [],
            message: "Invalid input",
          },
        ],
      },
    });

    const result = await formatApiError(res, "schedule");

    expect(result.payload.details?.[0].path).toBe("(root)");
  });

  test("handles legacy simple error responses", async () => {
    const res = createMockResponse(404, {
      error: "not_found",
      message: "Job not found",
    });

    const result = await formatApiError(res, "show");

    expect(result.payload).toEqual({
      code: "not_found",
      statusCode: 404,
      message: "Job not found",
      hint: undefined,
    });
    expect(result.message).toBe("show: Job not found");
  });

  test("handles legacy simple error without message", async () => {
    const res = createMockResponse(409, {
      error: "already_running",
    });

    const result = await formatApiError(res, "run-once");

    expect(result.payload.code).toBe("already_running");
    expect(result.payload.statusCode).toBe(409);
    expect(result.payload.message).toBe("already running");
    expect(result.message).toBe("run-once: already running");
  });

  test("handles new standardized not found error", async () => {
    const res = createMockResponse(404, {
      error: {
        code: "job_not_found",
        message: 'Job "backup" was not found',
        hint: "List available jobs with: crnd list",
      },
    });

    const result = await formatApiError(res, "show");

    expect(result.payload).toEqual({
      code: "job_not_found",
      statusCode: 404,
      message: 'Job "backup" was not found',
      hint: "List available jobs with: crnd list",
    });
    expect(result.message).toContain('show: Job "backup" was not found');
    expect(result.message).toContain("List available jobs with: crnd list");
  });

  test("handles failed JSON parsing", async () => {
    const res = {
      status: 500,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    };

    const result = await formatApiError(res, "list");

    expect(result.payload.code).toBe("error");
    expect(result.payload.statusCode).toBe(500);
    expect(result.message).toContain("list: Request failed with status 500");
  });

  test("handles unknown error format", async () => {
    const res = createMockResponse(500, {
      unexpected: "format",
    });

    const result = await formatApiError(res, "status");

    expect(result.payload.code).toBe("error");
    expect(result.payload.statusCode).toBe(500);
    expect(result.message).toContain("status: Request failed with status 500");
  });

  test("handles null body", async () => {
    const res = createMockResponse(502, null);

    const result = await formatApiError(res, "export");

    expect(result.payload.code).toBe("error");
    expect(result.payload.statusCode).toBe(502);
    expect(result.message).toContain("export: Request failed with status 502");
  });

  test("preserves received values of different types", async () => {
    const res = createMockResponse(400, {
      success: false,
      error: {
        issues: [
          { path: ["count"], message: "Must be number", received: "ten" },
          { path: ["enabled"], message: "Must be boolean", received: null },
          { path: ["items"], message: "Must be array", received: {} },
        ],
      },
    });

    const result = await formatApiError(res, "test");

    expect(result.message).toContain('count: Must be number (received: "ten")');
    expect(result.message).toContain(
      "enabled: Must be boolean (received: null)",
    );
    expect(result.message).toContain("items: Must be array (received: {})");
  });
});
