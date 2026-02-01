import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import appendEvent from "../../src/shared/events/appendEvent";
import getEventsPath from "../../src/shared/paths/getEventsPath";
import getJobRunsDir from "../../src/shared/paths/getJobRunsDir";
import getRunOutputPaths from "../../src/shared/paths/getRunOutputPaths";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("paths and events", () => {
  test("run output paths and events", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    const jobId = "job-1";
    const runId = "run-1";

    const dir = getJobRunsDir(jobId);
    expect(dir.includes(jobId)).toBe(true);
    const output = getRunOutputPaths(jobId, runId);
    expect(output.stdoutPath.endsWith(`${runId}.out`)).toBe(true);
    expect(output.stderrPath.endsWith(`${runId}.err`)).toBe(true);

    appendEvent("test_event", { ok: true });
    const eventsPath = getEventsPath();
    expect(existsSync(eventsPath)).toBe(true);
    const content = readFileSync(eventsPath, "utf-8");
    expect(content.includes("test_event")).toBe(true);

    restore();
    rmSync(root, { recursive: true, force: true });
  });
});
