import { describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import readJobsToml from "../../src/shared/jobs/readJobsToml";
import getJobsTomlPath from "../../src/shared/paths/getJobsTomlPath";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("readJobsToml", () => {
  test("returns empty when missing", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    const jobs = readJobsToml();
    expect(jobs.length).toBe(0);
    restore();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("reads content", async () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    const path = getJobsTomlPath();
    await Bun.write(
      path,
      '[jobs.test]\ncommand = ["/bin/echo", "hi"]\nschedule = "*/1 * * * *"\n',
    );
    const jobs = readJobsToml();
    expect(jobs[0]?.name).toBe("test");
    restore();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
