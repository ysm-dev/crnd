import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  existsSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import createLogger from "../../src/daemon/createLogger";
import createJobsFileSync from "../../src/daemon/jobs/createJobsFileSync";
import createScheduler from "../../src/daemon/scheduler/createScheduler";
import migrateDatabase from "../../src/db/migrateDatabase";
import openDatabase from "../../src/db/openDatabase";
import { jobs } from "../../src/db/schema";
import getJobsTomlPath from "../../src/shared/paths/getJobsTomlPath";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("jobs file sync", () => {
  let restoreEnv = () => {};
  let root = "";

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  beforeAll(() => {
    root = createTempRoot();
    restoreEnv = setXdgEnv(root);
  });

  afterAll(() => {
    restoreEnv();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("init, apply, stop", () => {
    const logger = createLogger();
    const { orm } = openDatabase();
    migrateDatabase(orm);
    const scheduler = createScheduler(orm);
    const sync = createJobsFileSync(orm, scheduler, logger);
    sync.init();

    const path = getJobsTomlPath();
    expect(existsSync(path)).toBe(true);

    const toml = `[jobs.test]\ncommand = ["/bin/echo", "hi"]\nschedule = "*/1 * * * *"\n`;
    const result = sync.applyFromText(toml);
    expect(result.ok).toBe(true);

    const invalid = sync.applyFromText("invalid=");
    expect(invalid.ok).toBe(false);

    const content = readFileSync(path, "utf-8");
    expect(content.includes("[jobs.test]")).toBe(true);
    sync.stop();
  });

  test("reloads after atomic rename", async () => {
    const logger = createLogger();
    const { orm } = openDatabase();
    migrateDatabase(orm);
    const scheduler = createScheduler(orm);
    const sync = createJobsFileSync(orm, scheduler, logger);
    sync.init();

    const jobsTomlPath = getJobsTomlPath();
    const tempPath = `${jobsTomlPath}.tmp`;
    writeFileSync(
      tempPath,
      '[jobs.renamed]\ncommand = ["echo", "hi"]\nschedule = "*/1 * * * *"\n',
      "utf-8",
    );
    renameSync(tempPath, jobsTomlPath);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const rows = orm.select().from(jobs).all();
      if (rows.some((row) => row.name === "renamed")) {
        sync.stop();
        return;
      }

      await wait(50);
    }

    const rows = orm.select().from(jobs).all();
    expect(rows.some((row) => row.name === "renamed")).toBe(true);
    sync.stop();
  });
});
