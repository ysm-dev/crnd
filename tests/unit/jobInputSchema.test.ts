import { describe, expect, test } from "bun:test";
import createJobInputSchema from "../../src/shared/jobs/createJobInputSchema";

describe("job input schema", () => {
  test("requires schedule or runAt", () => {
    const schema = createJobInputSchema();
    expect(() =>
      schema.parse({
        name: "job",
        command: ["/bin/echo", "hello"]
      })
    ).toThrow();
  });

  test("accepts schedule", () => {
    const schema = createJobInputSchema();
    const value = schema.parse({
      name: "job",
      command: ["/bin/echo", "hello"],
      schedule: "0 2 * * *"
    });
    expect(value.name).toBe("job");
  });

  test("accepts runAt", () => {
    const schema = createJobInputSchema();
    const value = schema.parse({
      name: "job",
      command: ["/bin/echo", "hello"],
      runAt: "2026-02-01T10:00:00Z"
    });
    expect(value.name).toBe("job");
  });
});
