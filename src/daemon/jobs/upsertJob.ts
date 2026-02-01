import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import type openDatabase from "../../db/openDatabase";
import { jobs } from "../../db/schema";
import type { z } from "zod";
import createJobInputSchema from "../../shared/jobs/createJobInputSchema";
import formatJobRow from "../../shared/jobs/formatJobRow";
import serializeCommand from "../../shared/jobs/serializeCommand";
import serializeEnv from "../../shared/jobs/serializeEnv";
import appendEvent from "../../shared/events/appendEvent";
import ensureAutostart from "../autostart/ensureAutostart";

type Db = ReturnType<typeof openDatabase>["orm"];
type JobInput = z.infer<ReturnType<typeof createJobInputSchema>>;

export default function upsertJob(db: Db, payload: unknown, id?: string) {
  const input: JobInput = createJobInputSchema().parse(payload);
  const existing = db.select().from(jobs).where(eq(jobs.name, input.name)).get();
  const now = new Date().toISOString();
  const scheduleType = input.schedule ? "cron" : "once";
  const jobId = existing?.id ?? id ?? ulid();

  const insertValues = {
    id: jobId,
    name: input.name,
    description: input.description ?? null,
    command: serializeCommand(input.command),
    cwd: input.cwd ?? null,
    env: input.env ? serializeEnv(input.env) : null,
    scheduleType,
    cron: input.schedule ?? null,
    runAt: input.runAt ?? null,
    timezone: input.timezone ?? null,
    overlapPolicy: input.overlapPolicy ?? "skip",
    timeoutMs: input.timeoutMs ?? null,
    paused: input.paused ?? false,
    createdAt: now,
    updatedAt: now,
    lastRunAt: existing?.lastRunAt ?? null,
    nextRunAt: existing?.nextRunAt ?? null
  };

  const updateValues = {
    description: insertValues.description,
    command: insertValues.command,
    cwd: insertValues.cwd,
    env: insertValues.env,
    scheduleType: insertValues.scheduleType,
    cron: insertValues.cron,
    runAt: insertValues.runAt,
    timezone: insertValues.timezone,
    overlapPolicy: insertValues.overlapPolicy,
    timeoutMs: insertValues.timeoutMs,
    paused: insertValues.paused,
    updatedAt: now
  };

  db.insert(jobs)
    .values(insertValues)
    .onConflictDoUpdate({
      target: jobs.name,
      set: updateValues
    })
    .run();

  const saved = db.select().from(jobs).where(eq(jobs.name, input.name)).get();
  if (!saved) {
    throw new Error("job_not_saved");
  }

  const job = formatJobRow(saved);
  const created = !existing;
  appendEvent(created ? "job_created" : "job_updated", { jobId: job.id, name: job.name });
  if (created) {
    ensureAutostart();
  }
  return { job, created };
}
