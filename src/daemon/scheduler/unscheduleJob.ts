import type createSchedulerState from "./createSchedulerState";

type SchedulerState = ReturnType<typeof createSchedulerState>;

export default function unscheduleJob(state: SchedulerState, jobId: string) {
  const cron = state.scheduled.get(jobId);
  if (cron) {
    cron.stop();
  }
  state.scheduled.delete(jobId);
}
