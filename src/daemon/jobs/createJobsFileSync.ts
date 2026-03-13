import type { FSWatcher } from "node:fs";
import { existsSync, watch } from "node:fs";
import path from "node:path";
import type openDatabase from "../../db/openDatabase";
import { jobs } from "../../db/schema";
import formatJobRow from "../../shared/jobs/formatJobRow";
import parseJobsToml from "../../shared/jobs/parseJobsToml";
import readJobsToml from "../../shared/jobs/readJobsToml";
import writeJobsToml from "../../shared/jobs/writeJobsToml";
import getJobsTomlPath from "../../shared/paths/getJobsTomlPath";
import type createLogger from "../createLogger";
import type createScheduler from "../scheduler/createScheduler";
import deleteJobByName from "./deleteJobByName";
import upsertJob from "./upsertJob";

type Db = ReturnType<typeof openDatabase>["orm"];
type Logger = ReturnType<typeof createLogger>;
type Scheduler = ReturnType<typeof createScheduler>;

export default function createJobsFileSync(
  db: Db,
  scheduler: Scheduler,
  logger: Logger,
) {
  let ignore = false;
  let watcher: FSWatcher | null = null;
  let applyTimer: ReturnType<typeof setTimeout> | null = null;

  const applyJobs = (jobsFromToml: ReturnType<typeof readJobsToml>) => {
    const existing = db.select().from(jobs).all().map(formatJobRow);
    const existingByName = new Map(existing.map((job) => [job.name, job]));
    const seen = new Set<string>();

    for (const entry of jobsFromToml) {
      const payload = {
        name: entry.name,
        description: entry.description,
        command: entry.command,
        cwd: entry.cwd,
        env: entry.env,
        schedule: entry.schedule,
        runAt: entry.run_at,
        timezone: entry.timezone,
        timeoutMs: entry.timeout_ms,
        paused: entry.paused,
        overlapPolicy: entry.overlap_policy,
      };

      const existingJob = existingByName.get(entry.name);
      const { job } = upsertJob(db, payload, entry.id ?? existingJob?.id);
      scheduler.upsert(job);
      seen.add(entry.name);
    }

    for (const job of existing) {
      if (!seen.has(job.name)) {
        scheduler.remove(job.id);
        deleteJobByName(db, job.name);
      }
    }
  };

  const applyFromFile = () => {
    try {
      const jobsFromToml = readJobsToml();
      applyJobs(jobsFromToml);
    } catch (error) {
      logger.error({ event: "jobs_toml_error", message: String(error) });
    }
  };

  const writeFromDb = () => {
    const rows = db.select().from(jobs).all().map(formatJobRow);
    ignore = true;
    try {
      writeJobsToml(rows);
    } finally {
      setTimeout(() => {
        ignore = false;
      }, 50);
    }
  };

  const queueApplyFromFile = () => {
    if (ignore) {
      return;
    }

    if (applyTimer) {
      clearTimeout(applyTimer);
    }

    applyTimer = setTimeout(() => {
      applyTimer = null;
      applyFromFile();
    }, 25);
  };

  return {
    init() {
      const jobsTomlPath = getJobsTomlPath();
      if (existsSync(jobsTomlPath)) {
        applyFromFile();
      } else {
        writeFromDb();
      }

      const jobsTomlDir = path.dirname(jobsTomlPath);
      const jobsTomlName = path.basename(jobsTomlPath);
      watcher = watch(jobsTomlDir, { persistent: false }, (_, filename) => {
        if (filename !== null && filename !== jobsTomlName) {
          return;
        }

        queueApplyFromFile();
      });
    },
    stop() {
      if (applyTimer) {
        clearTimeout(applyTimer);
        applyTimer = null;
      }
      watcher?.close();
    },
    writeFromDb,
    applyFromText(content: string) {
      try {
        const jobsFromToml = parseJobsToml(content);
        applyJobs(jobsFromToml);
        writeFromDb();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    },
  };
}
