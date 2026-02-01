import { describe, expect, test } from "bun:test";
import formatApiError from "../../src/cli/errors/formatApiError";

function createMockResponse(status: number, body: unknown) {
  return {
    status,
    json: async () => body,
  };
}

describe("formatApiError", () => {
  test("handles Zod validation errors", async () => {
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

    expect(result.payload).toEqual({
      status: "validation_error",
      code: 400,
      message: "Validation failed",
      errors: [
        {
          field: "runAt",
          message:
            "Invalid datetime. Use ISO 8601 with timezone (e.g., 2026-02-01T10:00:00Z)",
          received: "2026-02-01T22:38:23",
        },
      ],
    });
    expect(result.message).toBe(
      'schedule: validation failed\n  runAt: Invalid datetime. Use ISO 8601 with timezone (e.g., 2026-02-01T10:00:00Z) (received: "2026-02-01T22:38:23")',
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

    expect(result.payload.errors).toHaveLength(2);
    expect(result.payload.errors?.[0]).toEqual({
      field: "name",
      message: "Required",
      received: undefined,
    });
    expect(result.payload.errors?.[1]).toEqual({
      field: "schedule",
      message: "Invalid cron expression",
      received: "bad",
    });
    expect(result.message).toContain("schedule: validation failed");
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

    expect(result.payload.errors?.[0].field).toBe("command.0");
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

    expect(result.payload.errors?.[0].field).toBe("(root)");
  });

  test("handles simple error responses", async () => {
    const res = createMockResponse(404, {
      error: "not_found",
      message: "Job not found",
    });

    const result = await formatApiError(res, "show");

    expect(result.payload).toEqual({
      status: "not_found",
      code: 404,
      message: "Job not found",
    });
    expect(result.message).toBe("show: Job not found");
  });

  test("handles simple error without message", async () => {
    const res = createMockResponse(409, {
      error: "already_running",
    });

    const result = await formatApiError(res, "run-once");

    expect(result.payload).toEqual({
      status: "already_running",
      code: 409,
      message: "already_running",
    });
    expect(result.message).toBe("run-once: already_running");
  });

  test("handles failed JSON parsing", async () => {
    const res = {
      status: 500,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    };

    const result = await formatApiError(res, "list");

    expect(result.payload).toEqual({
      status: "error",
      code: 500,
    });
    expect(result.message).toBe("list: error (500)");
  });

  test("handles unknown error format", async () => {
    const res = createMockResponse(500, {
      unexpected: "format",
    });

    const result = await formatApiError(res, "status");

    expect(result.payload).toEqual({
      status: "error",
      code: 500,
    });
    expect(result.message).toBe("status: error (500)");
  });

  test("handles null body", async () => {
    const res = createMockResponse(502, null);

    const result = await formatApiError(res, "export");

    expect(result.payload).toEqual({
      status: "error",
      code: 502,
    });
    expect(result.message).toBe("export: error (502)");
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
