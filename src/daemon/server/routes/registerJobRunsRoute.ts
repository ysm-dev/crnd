import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import { jobs, runs } from "../../../db/schema";
import formatRunRow from "../../../shared/runs/formatRunRow";

type Db = ReturnType<typeof openDatabase>["orm"];

const paramsSchema = z.object({
  name: z.string().min(1)
});

const querySchema = z.object({
  limit: z.string().optional()
});

export default function registerJobRunsRoute(db: Db) {
  return new Hono().get(
    "/jobs/:name/runs",
    zValidator("param", paramsSchema),
    zValidator("query", querySchema),
    (c) => {
      const { name } = c.req.valid("param");
      const { limit } = c.req.valid("query");
      const row = db.select().from(jobs).where(eq(jobs.name, name)).get();
      if (!row) {
        return c.json({ error: "job_not_found" }, 404);
      }

      const parsedLimit = limit ? Number(limit) : 20;
      const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
      const rows = db
        .select()
        .from(runs)
        .where(eq(runs.jobId, row.id))
        .orderBy(desc(runs.startedAt))
        .limit(safeLimit)
        .all();

      return c.json(rows.map(formatRunRow));
    }
  );
}
