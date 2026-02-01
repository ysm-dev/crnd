import { ulid } from "ulid";
import type openDatabase from "../../db/openDatabase";
import { runs } from "../../db/schema";
import appendEvent from "../../shared/events/appendEvent";
import type formatJobRow from "../../shared/jobs/formatJobRow";

type Db = ReturnType<typeof openDatabase>["orm"];
type Job = ReturnType<typeof formatJobRow>;

export default function recordSkippedRun(db: Db, job: Job) {
  const now = new Date().toISOString();
  const runId = ulid();

  db.insert(runs)
    .values({
      id: runId,
      jobId: job.id,
      status: "skipped",
      startedAt: now,
      endedAt: now,
    })
    .run();

  appendEvent("run_skipped", { jobId: job.id, runId });

  return runId;
}
