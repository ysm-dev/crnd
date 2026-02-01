import { describe, expect, test } from "bun:test";
import parseJobsToml from "../../src/shared/jobs/parseJobsToml";

describe("parseJobsToml", () => {
  test("parses cron and one-time jobs", () => {
    const content = `
[jobs.backup]
command = ["/bin/echo", "hi"]
schedule = "0 2 * * *"
timezone = "UTC"

[jobs.once]
command = ["/bin/echo", "once"]
run_at = "2026-02-01T10:00:00Z"
`;

    const jobs = parseJobsToml(content);
    expect(jobs.length).toBe(2);
    expect(jobs[0]?.name).toBe("backup");
    expect(jobs[0]?.schedule).toBe("0 2 * * *");
    expect(jobs[1]?.name).toBe("once");
    expect(jobs[1]?.run_at).toBe("2026-02-01T10:00:00Z");
  });
});
