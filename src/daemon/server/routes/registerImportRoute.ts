import { Hono } from "hono";
import { z } from "zod";
import type createJobsFileSync from "../../jobs/createJobsFileSync";
import createZValidator from "../createZValidator";
import { importFailedResponse } from "./createErrorResponse";

type JobsFileSync = ReturnType<typeof createJobsFileSync>;

const payloadSchema = z.object({
  toml: z.string().min(1, "TOML content is required"),
});

export default function registerImportRoute(jobsFileSync: JobsFileSync) {
  return new Hono().post(
    "/import",
    createZValidator("json", payloadSchema),
    (c) => {
      const payload = c.req.valid("json");
      const result = jobsFileSync.applyFromText(payload.toml);
      if (!result.ok) {
        return c.json(
          importFailedResponse(result.error ?? "Unknown error"),
          400,
        );
      }

      return c.json({ ok: true });
    },
  );
}
