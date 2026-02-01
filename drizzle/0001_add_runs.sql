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
