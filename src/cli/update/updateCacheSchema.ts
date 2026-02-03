import { z } from "zod";

const updateCacheSchema = z.object({
  lastCheck: z.string().datetime(),
  latestVersion: z.string().min(1),
  currentVersionAtCheck: z.string().min(1),
});

export type UpdateCache = z.infer<typeof updateCacheSchema>;

export default updateCacheSchema;
