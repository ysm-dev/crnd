import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import type createJobsFileSync from "../../jobs/createJobsFileSync";
import deleteJobByName from "../../jobs/deleteJobByName";
import type createScheduler from "../../scheduler/createScheduler";

type Db = ReturnType<typeof openDatabase>["orm"];
type Scheduler = ReturnType<typeof createScheduler>;
type JobsFileSync = ReturnType<typeof createJobsFileSync>;

const paramsSchema = z.object({
  name: z.string().min(1)
});

export default function registerJobsDeleteRoute(
  db: Db,
  scheduler: Scheduler,
  jobsFileSync: JobsFileSync
) {
  return new Hono().delete("/jobs/:name", zValidator("param", paramsSchema), (c) => {
    const { name } = c.req.valid("param");
    const jobId = deleteJobByName(db, name);
    if (!jobId) {
      return c.json({ error: "job_not_found" }, 404);
    }

    scheduler.remove(jobId);
    jobsFileSync.writeFromDb();
    return c.json({ ok: true, jobId });
  });
}
