import { eq } from "drizzle-orm";
import type openDatabase from "../../db/openDatabase";
import { jobs, runs } from "../../db/schema";
import appendEvent from "../../shared/events/appendEvent";

type Db = ReturnType<typeof openDatabase>["orm"];

export default function deleteJobByName(db: Db, name: string) {
  const row = db.select().from(jobs).where(eq(jobs.name, name)).get();
  if (!row) {
    return null;
  }

  db.delete(runs).where(eq(runs.jobId, row.id)).run();
  db.delete(jobs).where(eq(jobs.id, row.id)).run();
  appendEvent("job_deleted", { jobId: row.id, name: row.name });
  return row.id;
}
