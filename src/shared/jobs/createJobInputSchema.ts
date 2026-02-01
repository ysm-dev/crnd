import { z } from "zod";
import createCommandSchema from "./createCommandSchema";
import createEnvSchema from "./createEnvSchema";

export default function createJobInputSchema() {
  return z
    .object({
      name: z
        .string({ error: "Job name is required" })
        .min(1, "Job name cannot be empty"),
      description: z.string().min(1, "Description cannot be empty").optional(),
      command: createCommandSchema(),
      cwd: z.string().min(1, "Working directory cannot be empty").optional(),
      env: createEnvSchema().optional(),
      schedule: z
        .string()
        .min(1, "Schedule expression cannot be empty")
        .optional(),
      runAt: z
        .string({
          error:
            "Invalid datetime format. Use ISO 8601 (e.g., 2026-02-01T10:00:00Z)",
        })
        .datetime({
          message:
            "Invalid datetime. Use ISO 8601 with timezone (e.g., 2026-02-01T10:00:00Z)",
        })
        .optional(),
      timezone: z
        .string()
        .min(
          1,
          "Timezone cannot be empty (use IANA format, e.g., America/New_York)",
        )
        .optional(),
      timeoutMs: z
        .number({ error: "Timeout must be a number" })
        .int("Timeout must be a whole number (milliseconds)")
        .positive("Timeout must be a positive number")
        .optional(),
      paused: z.boolean().optional(),
      overlapPolicy: z
        .enum(["skip", "allow"], {
          error: 'Overlap policy must be "skip" or "allow"',
        })
        .optional(),
    })
    .superRefine((value, ctx) => {
      const hasSchedule = Boolean(value.schedule);
      const hasRunAt = Boolean(value.runAt);
      if (hasSchedule === hasRunAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: hasSchedule
            ? "Provide either -s (schedule) or -a (at), not both"
            : "Missing schedule: use -s for cron or -a for one-time run",
          path: ["schedule"],
        });
      }
    });
}
