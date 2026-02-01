import { z } from "zod";
import createCommandSchema from "./createCommandSchema";
import createEnvSchema from "./createEnvSchema";

export default function createJobInputSchema() {
  return z
    .object({
      name: z.string().min(1),
      description: z.string().min(1).optional(),
      command: createCommandSchema(),
      cwd: z.string().min(1).optional(),
      env: createEnvSchema().optional(),
      schedule: z.string().min(1).optional(),
      runAt: z.string().datetime().optional(),
      timezone: z.string().min(1).optional(),
      timeoutMs: z.number().int().positive().optional(),
      paused: z.boolean().optional(),
      overlapPolicy: z.enum(["skip", "allow"]).optional(),
    })
    .superRefine((value, ctx) => {
      const hasSchedule = Boolean(value.schedule);
      const hasRunAt = Boolean(value.runAt);
      if (hasSchedule === hasRunAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Provide schedule or runAt",
          path: ["schedule"],
        });
      }
    });
}
