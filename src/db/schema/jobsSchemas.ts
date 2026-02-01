import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import getJobsTable from "./jobs";

export default function createJobsSchemas() {
  const jobs = getJobsTable();
  return {
    insert: createInsertSchema(jobs),
    select: createSelectSchema(jobs),
  };
}
