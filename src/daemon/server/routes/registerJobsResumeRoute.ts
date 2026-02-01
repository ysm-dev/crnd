import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import { jobs } from "../../../db/schema";
import formatJobRow from "../../../shared/jobs/formatJobRow";
import appendEvent from "../../../shared/events/appendEvent";
import type createJobsFileSync from "../../jobs/createJobsFileSync";
import type createScheduler from "../../scheduler/createScheduler";

type Db = ReturnType<typeof openDatabase>["orm"];
type Scheduler = ReturnType<typeof createScheduler>;
type JobsFileSync = ReturnType<typeof createJobsFileSync>;

const paramsSchema = z.object({
  name: z.string().min(1)
});

export default function registerJobsResumeRoute(
  db: Db,
  scheduler: Scheduler,
  jobsFileSync: JobsFileSync
) {
  return new Hono().post("/jobs/:name/resume", zValidator("param", paramsSchema), (c) => {
    const { name } = c.req.valid("param");
    const row = db.select().from(jobs).where(eq(jobs.name, name)).get();
    if (!row) {
      return c.json({ error: "job_not_found" }, 404);
    }

    const now = new Date().toISOString();
    db.update(jobs)
      .set({ paused: false, updatedAt: now })
      .where(eq(jobs.id, row.id))
      .run();

    const updated = db.select().from(jobs).where(eq(jobs.id, row.id)).get();
    if (!updated) {
      return c.json({ error: "job_not_found" }, 404);
    }

    const job = formatJobRow(updated);
    scheduler.upsert(job);
    jobsFileSync.writeFromDb();
    appendEvent("job_resumed", { jobId: job.id, name: job.name });
    return c.json(job);
  });
}
