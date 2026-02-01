import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import recoverRunningRuns from "../../src/daemon/runner/recoverRunningRuns";
import upsertJob from "../../src/daemon/jobs/upsertJob";
import openDatabase from "../../src/db/openDatabase";
import migrateDatabase from "../../src/db/migrateDatabase";
import { runs } from "../../src/db/schema";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("recoverRunningRuns", () => {
  test("marks missing pid as lost", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    const { orm } = openDatabase();
    migrateDatabase(orm);

    const { job } = upsertJob(orm, {
      name: "job",
      command: ["/bin/echo", "hello"],
      schedule: "*/1 * * * *"
    });

    orm.insert(runs)
      .values({
        id: "run1",
        jobId: job.id,
        status: "running",
        pid: 999999,
        startedAt: new Date().toISOString()
      })
      .run();

    recoverRunningRuns(orm);
    const row = orm.select().from(runs).where(eq(runs.id, "run1")).get();
    expect(row?.status).toBe("lost");
    restore();
  });
});
