import toml from "@iarna/toml";
import { z } from "zod";
import isRecord from "../utils/isRecord";
import createTomlJobSchema from "./createTomlJobSchema";

export default function parseJobsToml(content: string) {
  const parsed = toml.parse(content);
  if (!isRecord(parsed)) {
    throw new Error("Invalid jobs.toml");
  }

  const jobsValue = parsed.jobs;
  if (jobsValue === undefined) {
    return [];
  }
  if (!isRecord(jobsValue)) {
    throw new Error("Invalid jobs section");
  }

  const namedSchema = createTomlJobSchema().and(
    z.object({
      name: z.string().min(1),
    }),
  );
  const result: Array<z.infer<typeof namedSchema>> = [];

  for (const [name, value] of Object.entries(jobsValue)) {
    if (!isRecord(value)) {
      throw new Error(`Invalid job entry: ${name}`);
    }
    const job = namedSchema.parse({ name, ...value });
    result.push(job);
  }

  return result;
}
