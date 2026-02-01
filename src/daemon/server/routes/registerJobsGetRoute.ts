import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import { jobs } from "../../../db/schema";
import formatJobRow from "../../../shared/jobs/formatJobRow";

type Db = ReturnType<typeof openDatabase>["orm"];

const paramsSchema = z.object({
  name: z.string().min(1)
});

export default function registerJobsGetRoute(db: Db) {
  return new Hono().get("/jobs/:name", zValidator("param", paramsSchema), (c) => {
    const { name } = c.req.valid("param");
    const row = db.select().from(jobs).where(eq(jobs.name, name)).get();
    if (!row) {
      return c.json({ error: "job_not_found" }, 404);
    }

    return c.json(formatJobRow(row));
  });
}
