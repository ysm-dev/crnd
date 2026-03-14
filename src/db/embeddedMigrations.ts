export const EMBEDDED_MIGRATIONS: Record<string, string> = {
  "0000_init.sql": `CREATE TABLE IF NOT EXISTS "jobs" (
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
`,
  "0001_add_runs.sql": `CREATE TABLE IF NOT EXISTS "runs" (
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
`,
  "meta/_journal.json": `${JSON.stringify(
    {
      version: "5",
      dialect: "sqlite",
      entries: [
        {
          idx: 0,
          version: "0000",
          when: 1700000000000,
          tag: "0000_init",
          breakpoints: true,
        },
        {
          idx: 1,
          version: "0001",
          when: 1700000001000,
          tag: "0001_add_runs",
          breakpoints: true,
        },
      ],
    },
    null,
    2,
  )}
`,
};
