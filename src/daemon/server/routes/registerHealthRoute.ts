import { Hono } from "hono";
import { z } from "zod";

const healthPayloadSchema = z.object({
  status: z.literal("ok"),
  startedAt: z.string(),
  pid: z.number().int(),
  version: z.string()
});

type HealthPayload = z.infer<typeof healthPayloadSchema>;

export default function registerHealthRoute(payload: HealthPayload) {
  const parsed = healthPayloadSchema.parse(payload);
  return new Hono().get("/health", (c) => c.json(parsed));
}
