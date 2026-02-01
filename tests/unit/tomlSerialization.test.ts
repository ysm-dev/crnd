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
        overlapPolicy: "skip"
      }
    ];

    const toml = serializeJobsToml(jobs);
    const parsed = parseJobsToml(toml);
    expect(parsed[0]?.name).toBe("job");
    expect(parsed[0]?.schedule).toBe("0 2 * * *");
  });
});
