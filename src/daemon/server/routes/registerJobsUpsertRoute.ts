import { Hono } from "hono";
import type openDatabase from "../../../db/openDatabase";
import createJobInputSchema from "../../../shared/jobs/createJobInputSchema";
import type createJobsFileSync from "../../jobs/createJobsFileSync";
import upsertJob from "../../jobs/upsertJob";
import type createScheduler from "../../scheduler/createScheduler";
import createZValidator from "../createZValidator";

type Db = ReturnType<typeof openDatabase>["orm"];
type Scheduler = ReturnType<typeof createScheduler>;
type JobsFileSync = ReturnType<typeof createJobsFileSync>;

export default function registerJobsUpsertRoute(
  db: Db,
  scheduler: Scheduler,
  jobsFileSync: JobsFileSync,
) {
  const schema = createJobInputSchema();
  return new Hono().post("/jobs", createZValidator("json", schema), (c) => {
    const input = c.req.valid("json");
    try {
      const result = upsertJob(db, input);
      scheduler.upsert(result.job);
      jobsFileSync.writeFromDb();
      return c.json(result.job);
    } catch {
      return c.json({ error: "job_not_saved" }, 500);
    }
  });
}
