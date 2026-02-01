import type openDatabase from "../../db/openDatabase";
import type formatJobRow from "../../shared/jobs/formatJobRow";
import createSchedulerState from "./createSchedulerState";
import loadJobs from "./loadJobs";
import runJobWithTracking from "./runJobWithTracking";
import scheduleJob from "./scheduleJob";
import unscheduleJob from "./unscheduleJob";

type Db = ReturnType<typeof openDatabase>["orm"];
type Job = ReturnType<typeof formatJobRow>;

export default function createScheduler(db: Db) {
  const state = createSchedulerState();
  const stop = () => {
    for (const jobId of state.scheduled.keys()) {
      unscheduleJob(state, jobId);
    }
    state.running.clear();
  };

  return {
    start() {
      stop();
      const jobs = loadJobs(db);
      for (const job of jobs) {
        scheduleJob(state, db, job, (current) => {
          runJobWithTracking(state, db, current);
        });
      }
    },
    stop,
    upsert(job: Job) {
      unscheduleJob(state, job.id);
      scheduleJob(state, db, job, (current) => {
        runJobWithTracking(state, db, current);
      });
    },
    remove(jobId: string) {
      unscheduleJob(state, jobId);
    },
    runNow(job: Job) {
      return runJobWithTracking(state, db, job);
    },
  };
}
