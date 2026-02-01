import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const jobsTable = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  command: text("command").notNull(),
  cwd: text("cwd"),
  env: text("env"),
  scheduleType: text("schedule_type").notNull(),
  cron: text("cron"),
  runAt: text("run_at"),
  timezone: text("timezone"),
  overlapPolicy: text("overlap_policy").notNull().default("skip"),
  timeoutMs: integer("timeout_ms"),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastRunAt: text("last_run_at"),
  nextRunAt: text("next_run_at"),
});

export default function getJobsTable() {
  return jobsTable;
}
