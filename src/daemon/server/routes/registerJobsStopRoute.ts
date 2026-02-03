import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import { jobs, runs } from "../../../db/schema";
import createZValidator from "../createZValidator";
import {
  jobNotFoundResponse,
  runNotRunningResponse,
  stopFailedResponse,
} from "./createErrorResponse";

type Db = ReturnType<typeof openDatabase>["orm"];

const paramsSchema = z.object({
  name: z.string().min(1, "Job name is required"),
});

export default function registerJobsStopRoute(db: Db) {
  return new Hono().post(
    "/jobs/:name/stop",
    createZValidator("param", paramsSchema),
    (c) => {
      const { name } = c.req.valid("param");
      const job = db.select().from(jobs).where(eq(jobs.name, name)).get();
      if (!job) {
        return c.json(jobNotFoundResponse(name), 404);
      }

      const run = db
        .select()
        .from(runs)
        .where(eq(runs.jobId, job.id))
        .orderBy(desc(runs.startedAt))
        .get();

      if (!run || run.status !== "running" || !run.pid) {
        return c.json(runNotRunningResponse(name), 409);
      }

      try {
        process.kill(run.pid, "SIGTERM");
      } catch {
        return c.json(stopFailedResponse(name), 500);
      }

      return c.json({ ok: true, runId: run.id });
    },
  );
}
