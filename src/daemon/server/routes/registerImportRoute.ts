import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type createJobsFileSync from "../../jobs/createJobsFileSync";

type JobsFileSync = ReturnType<typeof createJobsFileSync>;

const payloadSchema = z.object({
  toml: z.string().min(1)
});

export default function registerImportRoute(jobsFileSync: JobsFileSync) {
  return new Hono().post("/import", zValidator("json", payloadSchema), (c) => {
    const payload = c.req.valid("json");
    const result = jobsFileSync.applyFromText(payload.toml);
    if (!result.ok) {
      return c.json({ error: "import_failed", message: result.error }, 400);
    }

    return c.json({ ok: true });
  });
}
