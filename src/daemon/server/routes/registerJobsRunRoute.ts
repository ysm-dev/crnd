import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import { jobs } from "../../../db/schema";
import formatJobRow from "../../../shared/jobs/formatJobRow";
import type createScheduler from "../../scheduler/createScheduler";
import createZValidator from "../createZValidator";
import { jobNotFoundResponse } from "./createErrorResponse";

type Db = ReturnType<typeof openDatabase>["orm"];
type Scheduler = ReturnType<typeof createScheduler>;

const payloadSchema = z.object({
  name: z.string().min(1, "Job name is required"),
});

export default function registerJobsRunRoute(db: Db, scheduler: Scheduler) {
  return new Hono().post(
    "/jobs/run",
    createZValidator("json", payloadSchema),
    (c) => {
      const payload = c.req.valid("json");
      const row = db
        .select()
        .from(jobs)
        .where(eq(jobs.name, payload.name))
        .get();
      if (!row) {
        return c.json(jobNotFoundResponse(payload.name), 404);
      }

      const job = formatJobRow(row);
      const runId = scheduler.runNow(job);
      return c.json({ ok: true, jobId: job.id, runId });
    },
  );
}
