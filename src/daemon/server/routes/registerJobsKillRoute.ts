import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import { jobs, runs } from "../../../db/schema";

type Db = ReturnType<typeof openDatabase>["orm"];

const paramsSchema = z.object({
  name: z.string().min(1),
});

export default function registerJobsKillRoute(db: Db) {
  return new Hono().post(
    "/jobs/:name/kill",
    zValidator("param", paramsSchema),
    (c) => {
      const { name } = c.req.valid("param");
      const job = db.select().from(jobs).where(eq(jobs.name, name)).get();
      if (!job) {
        return c.json({ error: "job_not_found" }, 404);
      }

      const run = db
        .select()
        .from(runs)
        .where(eq(runs.jobId, job.id))
        .orderBy(desc(runs.startedAt))
        .get();

      if (!run || run.status !== "running" || !run.pid) {
        return c.json({ error: "run_not_running" }, 409);
      }

      try {
        process.kill(run.pid, "SIGKILL");
      } catch {
        return c.json({ error: "kill_failed" }, 500);
      }

      return c.json({ ok: true, runId: run.id });
    },
  );
}
