import toml from "@iarna/toml";
import type { JsonMap } from "@iarna/toml";
import type formatJobRow from "./formatJobRow";

export default function serializeJobsToml(jobs: Array<ReturnType<typeof formatJobRow>>) {
  const jobsSection: JsonMap = {};
  const doc: JsonMap = { jobs: jobsSection };

  for (const job of jobs) {
    const entry: JsonMap = {
      id: job.id,
      command: job.command,
      paused: job.paused,
      overlap_policy: job.overlapPolicy
    };

    if (job.description) {
      entry.description = job.description;
    }
    if (job.cwd) {
      entry.cwd = job.cwd;
    }
    if (job.env) {
      entry.env = job.env;
    }
    if (job.scheduleType === "cron" && job.cron) {
      entry.schedule = job.cron;
    }
    if (job.scheduleType === "once" && job.runAt) {
      entry.run_at = job.runAt;
    }
    if (job.timezone) {
      entry.timezone = job.timezone;
    }
    if (job.timeoutMs) {
      entry.timeout_ms = job.timeoutMs;
    }

    jobsSection[job.name] = entry;
  }

  return toml.stringify(doc);
}
