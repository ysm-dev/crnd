import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import getRunsTable from "./runs";

export default function createRunsSchemas() {
  const runs = getRunsTable();
  return {
    insert: createInsertSchema(runs),
    select: createSelectSchema(runs)
  };
}
