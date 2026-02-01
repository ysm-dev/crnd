CREATE TABLE IF NOT EXISTS "jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "command" text NOT NULL,
  "cwd" text,
  "env" text,
  "schedule_type" text NOT NULL,
  "cron" text,
  "run_at" text,
  "timezone" text,
  "overlap_policy" text NOT NULL DEFAULT 'skip',
  "timeout_ms" integer,
  "paused" integer NOT NULL DEFAULT 0,
  "created_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_run_at" text,
  "next_run_at" text
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "runs" (
  "id" text PRIMARY KEY NOT NULL,
  "job_id" text NOT NULL REFERENCES "jobs"("id"),
  "status" text NOT NULL,
  "pid" integer,
  "exit_code" integer,
  "signal" text,
  "started_at" text,
  "ended_at" text,
  "stdout_path" text,
  "stderr_path" text,
  "error_message" text
);
