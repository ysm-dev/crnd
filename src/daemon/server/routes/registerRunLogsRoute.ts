import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../../db/openDatabase";
import { runs } from "../../../db/schema";

type Db = ReturnType<typeof openDatabase>["orm"];

const paramsSchema = z.object({
  id: z.string().min(1)
});

export default function registerRunLogsRoute(db: Db) {
  return new Hono().get("/runs/:id/logs", zValidator("param", paramsSchema), (c) => {
    const { id } = c.req.valid("param");
    const row = db.select().from(runs).where(eq(runs.id, id)).get();
    if (!row) {
      return c.json({ error: "run_not_found" }, 404);
    }

    return c.json({
      runId: row.id,
      stdoutPath: row.stdoutPath,
      stderrPath: row.stderrPath
    });
  });
}
