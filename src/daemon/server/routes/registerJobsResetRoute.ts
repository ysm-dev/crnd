import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import { jobs, runs } from "../../../db/schema";
import appendEvent from "../../../shared/events/appendEvent";
import formatJobRow from "../../../shared/jobs/formatJobRow";
import type createJobsFileSync from "../../jobs/createJobsFileSync";
import type createScheduler from "../../scheduler/createScheduler";
import createZValidator from "../createZValidator";
import { jobNotFoundResponse } from "./createErrorResponse";

type Db = ReturnType<typeof openDatabase>["orm"];
type Scheduler = ReturnType<typeof createScheduler>;
type JobsFileSync = ReturnType<typeof createJobsFileSync>;

const paramsSchema = z.object({
  name: z.string().min(1, "Job name is required"),
});

export default function registerJobsResetRoute(
  db: Db,
  scheduler: Scheduler,
  jobsFileSync: JobsFileSync,
) {
  return new Hono().post(
    "/jobs/:name/reset",
    createZValidator("param", paramsSchema),
    (c) => {
      const { name } = c.req.valid("param");
      const row = db.select().from(jobs).where(eq(jobs.name, name)).get();
      if (!row) {
        return c.json(jobNotFoundResponse(name), 404);
      }

      db.delete(runs).where(eq(runs.jobId, row.id)).run();
      const now = new Date().toISOString();
      db.update(jobs)
        .set({ lastRunAt: null, nextRunAt: null, updatedAt: now })
        .where(eq(jobs.id, row.id))
        .run();

      const updated = db.select().from(jobs).where(eq(jobs.id, row.id)).get();
      if (!updated) {
        return c.json(jobNotFoundResponse(name), 404);
      }

      const job = formatJobRow(updated);
      scheduler.upsert(job);
      jobsFileSync.writeFromDb();
      appendEvent("job_reset", { jobId: job.id, name: job.name });
      return c.json(job);
    },
  );
}
