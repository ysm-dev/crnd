import { describe, expect, test } from "bun:test";
import parseJobsToml from "../../src/shared/jobs/parseJobsToml";
import serializeJobsToml from "../../src/shared/jobs/serializeJobsToml";

describe("toml serialization", () => {
  test("roundtrip", () => {
    const jobs = [
      {
        id: "01JTEST",
        name: "job",
        description: "desc",
        command: ["/bin/echo", "hello"],
        cwd: null,
        env: null,
        scheduleType: "cron",
        cron: "0 2 * * *",
        runAt: null,
        timezone: "UTC",
        timeoutMs: null,
        paused: false,
        overlapPolicy: "skip",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        lastRunAt: null,
        nextRunAt: null,
      },
    ];

    const toml = serializeJobsToml(jobs);
    const parsed = parseJobsToml(toml);
    expect(parsed[0]?.name).toBe("job");
    expect(parsed[0]?.schedule).toBe("0 2 * * *");
  });
});
