import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import createSchedulerState from "../../src/daemon/scheduler/createSchedulerState";
import runJobWithTracking from "../../src/daemon/scheduler/runJobWithTracking";
import openDatabase from "../../src/db/openDatabase";
import migrateDatabase from "../../src/db/migrateDatabase";
import { runs } from "../../src/db/schema";
import upsertJob from "../../src/daemon/jobs/upsertJob";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("runJobWithTracking", () => {
  test("skips overlapping run", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    const { orm } = openDatabase();
    migrateDatabase(orm);

    const { job } = upsertJob(orm, {
      name: "job",
      command: ["/bin/echo", "hello"],
      schedule: "*/1 * * * *",
      overlapPolicy: "skip"
    });

    const state = createSchedulerState();
    state.running.add(job.id);
    const runId = runJobWithTracking(state, orm, job);
    if (typeof runId !== "string") {
      throw new Error("missing run id");
    }
    const row = orm.select().from(runs).where(eq(runs.id, runId)).get();
    expect(row?.status).toBe("skipped");
    restore();
  });
});
