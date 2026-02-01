import type openDatabase from "../../db/openDatabase";
import type formatJobRow from "../../shared/jobs/formatJobRow";
import recordSkippedRun from "../runner/recordSkippedRun";
import runJob from "../runner/runJob";
import type createSchedulerState from "./createSchedulerState";
import updateNextRunAt from "./updateNextRunAt";

type Db = ReturnType<typeof openDatabase>["orm"];
type Job = ReturnType<typeof formatJobRow>;
type SchedulerState = ReturnType<typeof createSchedulerState>;

export default function runJobWithTracking(state: SchedulerState, db: Db, job: Job) {
  if (state.running.has(job.id) && job.overlapPolicy === "skip") {
    const runId = recordSkippedRun(db, job);
    const cron = state.scheduled.get(job.id);
    if (cron) {
      updateNextRunAt(db, job.id, cron.nextRun());
    }
    return runId;
  }

  state.running.add(job.id);
  const result = runJob(db, job);

  result.exited
    .then(() => {
      state.running.delete(job.id);

      const cron = state.scheduled.get(job.id);
      if (cron) {
        const nextRun = cron.nextRun();
        updateNextRunAt(db, job.id, nextRun);
        if (!nextRun) {
          cron.stop();
          state.scheduled.delete(job.id);
        }
      }
    })
    .catch(() => {
      state.running.delete(job.id);
    });

  return result.runId;
}
