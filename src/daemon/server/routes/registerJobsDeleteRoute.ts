import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import type createJobsFileSync from "../../jobs/createJobsFileSync";
import deleteJobByName from "../../jobs/deleteJobByName";
import type createScheduler from "../../scheduler/createScheduler";
import createZValidator from "../createZValidator";
import { jobNotFoundResponse } from "./createErrorResponse";

type Db = ReturnType<typeof openDatabase>["orm"];
type Scheduler = ReturnType<typeof createScheduler>;
type JobsFileSync = ReturnType<typeof createJobsFileSync>;

const paramsSchema = z.object({
  name: z.string().min(1, "Job name is required"),
});

export default function registerJobsDeleteRoute(
  db: Db,
  scheduler: Scheduler,
  jobsFileSync: JobsFileSync,
) {
  return new Hono().delete(
    "/jobs/:name",
    createZValidator("param", paramsSchema),
    (c) => {
      const { name } = c.req.valid("param");
      const jobId = deleteJobByName(db, name);
      if (!jobId) {
        return c.json(jobNotFoundResponse(name), 404);
      }

      scheduler.remove(jobId);
      jobsFileSync.writeFromDb();
      return c.json({ ok: true, jobId });
    },
  );
}
