import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import getJobsTable from "./jobs";

const jobsTable = getJobsTable();
const runsTable = sqliteTable("runs", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobsTable.id),
  status: text("status").notNull(),
  pid: integer("pid"),
  exitCode: integer("exit_code"),
  signal: text("signal"),
  startedAt: text("started_at"),
  endedAt: text("ended_at"),
  stdoutPath: text("stdout_path"),
  stderrPath: text("stderr_path"),
  errorMessage: text("error_message"),
});

export default function getRunsTable() {
  return runsTable;
}
