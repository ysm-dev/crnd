import { z } from "zod";
import createCommandSchema from "./createCommandSchema";
import createEnvSchema from "./createEnvSchema";

export default function createTomlJobSchema() {
  return z
    .object({
      id: z.string().min(1).optional(),
      command: createCommandSchema(),
      cwd: z.string().min(1).optional(),
      env: createEnvSchema().optional(),
      schedule: z.string().min(1).optional(),
      run_at: z.string().datetime().optional(),
      timezone: z.string().min(1).optional(),
      timeout_ms: z.number().int().positive().optional(),
      paused: z.boolean().optional(),
      overlap_policy: z.enum(["skip", "allow"]).optional(),
      description: z.string().min(1).optional(),
    })
    .superRefine((value, ctx) => {
      const hasSchedule = Boolean(value.schedule);
      const hasRunAt = Boolean(value.run_at);
      if (hasSchedule === hasRunAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Provide schedule or run_at",
          path: ["schedule"],
        });
      }
    });
}
