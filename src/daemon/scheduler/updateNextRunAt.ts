import { eq } from "drizzle-orm";
import type openDatabase from "../../db/openDatabase";
import { jobs } from "../../db/schema";

type Db = ReturnType<typeof openDatabase>["orm"];

export default function updateNextRunAt(db: Db, jobId: string, nextRun: Date | null) {
  const nextRunAt = nextRun ? nextRun.toISOString() : null;
  db.update(jobs).set({ nextRunAt }).where(eq(jobs.id, jobId)).run();
}
