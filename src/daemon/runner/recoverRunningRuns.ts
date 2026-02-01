import { eq } from "drizzle-orm";
import type openDatabase from "../../db/openDatabase";
import { runs } from "../../db/schema";
import appendEvent from "../../shared/events/appendEvent";

type Db = ReturnType<typeof openDatabase>["orm"];

export default function recoverRunningRuns(db: Db) {
  const running = db.select().from(runs).where(eq(runs.status, "running")).all();
  const now = new Date().toISOString();

  for (const run of running) {
    if (!run.pid) {
      db.update(runs)
        .set({ status: "lost", endedAt: now })
        .where(eq(runs.id, run.id))
        .run();
      appendEvent("run_lost", { runId: run.id, jobId: run.jobId });
      continue;
    }

    try {
      process.kill(run.pid, 0);
    } catch {
      db.update(runs)
        .set({ status: "lost", endedAt: now })
        .where(eq(runs.id, run.id))
        .run();
      appendEvent("run_lost", { runId: run.id, jobId: run.jobId });
    }
  }
}
