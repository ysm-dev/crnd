import { z } from "zod";

export default function createDaemonStateSchema() {
  return z.object({
    port: z.number().int().positive(),
    token: z.string().min(1),
    pid: z.number().int().positive(),
    startedAt: z.string().datetime(),
    version: z.string().min(1),
  });
}

export type DaemonState = z.infer<ReturnType<typeof createDaemonStateSchema>>;
