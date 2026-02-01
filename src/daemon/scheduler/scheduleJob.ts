import { Cron } from "croner";
import type openDatabase from "../../db/openDatabase";
import type formatJobRow from "../../shared/jobs/formatJobRow";
import type createSchedulerState from "./createSchedulerState";
import updateNextRunAt from "./updateNextRunAt";

type Db = ReturnType<typeof openDatabase>["orm"];
type Job = ReturnType<typeof formatJobRow>;
type SchedulerState = ReturnType<typeof createSchedulerState>;

export default function scheduleJob(
  state: SchedulerState,
  db: Db,
  job: Job,
  runScheduled: (job: Job) => void
) {
  if (job.paused) {
    return;
  }

  const pattern = job.scheduleType === "cron" ? job.cron : job.runAt;
  if (!pattern) {
    return;
  }

  const cron = new Cron(
    pattern,
    { timezone: job.timezone ?? undefined },
    () => runScheduled(job)
  );

  state.scheduled.set(job.id, cron);
  updateNextRunAt(db, job.id, cron.nextRun());
}
