import { beforeEach, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import openDatabase from "../../src/db/openDatabase";
import migrateDatabase from "../../src/db/migrateDatabase";
import { eq } from "drizzle-orm";
import { jobs } from "../../src/db/schema";
import upsertJob from "../../src/daemon/jobs/upsertJob";
import formatJobRow from "../../src/shared/jobs/formatJobRow";

describe("upsertJob", () => {
  const tempRoot = path.join(os.tmpdir(), "crnd-test");

  beforeEach(() => {
    process.env.XDG_DATA_HOME = tempRoot;
    process.env.XDG_CONFIG_HOME = tempRoot;
    process.env.CRND_DISABLE_AUTOSTART = "1";
    if (existsSync(tempRoot)) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test("inserts a job into sqlite", () => {
    const { orm } = openDatabase();
    migrateDatabase(orm);

    const payload = {
      name: "backup",
      command: ["/bin/echo", "ok"],
      schedule: "0 2 * * *",
      timezone: "UTC"
    };

    const result = upsertJob(orm, payload);
    const row = orm.select().from(jobs).where(eq(jobs.name, "backup")).get();
    expect(row).toBeTruthy();
    if (!row) {
      throw new Error("missing job row");
    }
    const job = formatJobRow(row);
    expect(job.name).toBe("backup");
    expect(result.job.id).toBe(job.id);
  });
});
