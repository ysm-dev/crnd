# crnd SPEC

## 1. Vision
crnd is a zero-config, local-only scheduler and process manager with a verb-first CLI. It favors automation and agent-first UX, runs jobs as separate OS processes, and stays stable without zombie processes.

## 2. Goals
- Cross-platform: Linux, macOS, Windows.
- Single binary install via Bun compile; no Docker or external services.
- Local-only daemon with typed RPC, no remote connectivity.
- Manage multiple schedules: create, update, read, delete, pause, resume, list, reset, kill, stop, status, run-once, logs, export/import, doctor.
- Hybrid storage: SQLite for runtime state and history, TOML for human editing.
- Stable, fault-tolerant operation; consistent scheduling semantics.
- No interactive mode; safe defaults and predictable output.

## 3. Non-goals
- Natural language date parsing.
- Distributed or remote scheduling.
- Interactive TUI.
- Docker-based install.

## 4. Tech Stack
- Runtime/build: Bun, compiled via `bun build --compile`.
- DB: `bun:sqlite`, file-based with WAL enabled.
- ORM: Drizzle ORM with `drizzle-orm/sqlite-core` and bun adapter.
- Schema validation: Zod + `drizzle-zod` for derived schemas.
- CLI: Citty.
- Logging: Consola (JSON reporter for daemon logs).
- Paths: env-paths (XDG-compliant directories).
- RPC: Hono server + Hono RPC client (`hono/client`).
- Cron parsing: Croner (timezone-aware, 5-field cron).
- Validation middleware: `@hono/zod-validator` (`zValidator`) for all RPC inputs.
- Error formatting: `zod-validation-error` for user-friendly validation messages.
- IDs: ULID (`ulid` + monotonic factory).
- Tests: `bun:test`.
- Tooling: Biome v2 (format/lint/check), tsgo (TypeScript preview) for typecheck.

## 5. Architecture
### Components
- CLI (`crnd`): parses commands, calls daemon via Hono RPC, prints results.
- Daemon: manages schedules, spawns processes, tracks runs, exposes RPC.
- Runner: scheduler loop using Croner; computes next runs and launches jobs.
- Storage: SQLite for state/history, TOML for editable job definitions.

### Execution Model
- Each job runs as a separate OS process using `Bun.spawn`.
- On macOS/Linux: commands are spawned via `$SHELL -lc` (user's login shell) to source shell configs (`.bash_profile`, `.zshrc`, etc.), ensuring user-modified PATH is available.
- On Windows: commands are spawned directly as argv array.
- Per-user daemon, auto-started at login (best effort), on-demand fallback.

## 6. Lifecycle and Autostart
- Default: daemon auto-starts when CLI needs it.
- Per-user auto-start installed automatically on first scheduled job:
  - macOS: LaunchAgent in `~/Library/LaunchAgents/com.crnd.daemon.plist`.
  - Linux: systemd user service in `~/.config/systemd/user/crnd.service` (if available).
  - Windows: Task Scheduler task under current user.
- If OS integration is unavailable, daemon still starts on-demand and prints a warning in `crnd doctor`.

## 7. Data Model (Drizzle)
### Tables
- `jobs`
  - `id` (ULID, primary key)
  - `name` (unique)
  - `description`
  - `command` (JSON array of argv)
  - `cwd`
  - `env` (JSON object)
  - `schedule_type` ("cron" | "once")
  - `cron` (string, nullable)
  - `run_at` (ISO string, nullable)
  - `timezone` (IANA name, nullable)
  - `overlap_policy` ("skip" | "allow", default "skip")
  - `timeout_ms` (integer, nullable)
  - `paused` (boolean)
  - `created_at`, `updated_at`
  - `last_run_at`, `next_run_at` (nullable)
- `runs`
  - `id` (ULID, primary key)
  - `job_id` (FK)
  - `status` ("queued" | "running" | "success" | "failed" | "skipped" | "canceled" | "killed" | "timed_out" | "lost")
  - `pid` (integer, nullable)
  - `exit_code` (integer, nullable)
  - `signal` (string, nullable)
  - `started_at`, `ended_at`
  - `stdout_path`, `stderr_path`
  - `error_message` (nullable)

### Types and Validation
- All Zod schemas are derived from Drizzle using `drizzle-zod` (`createInsertSchema`, `createSelectSchema`, `createUpdateSchema`).
- No manual TypeScript interfaces; use `z.infer` on Zod schemas.

## 8. Job Definitions (TOML)
### Location
- `jobs.toml` in XDG config directory (via env-paths).

### Format
```toml
[jobs.backup]
id = "01J8Z7KX2B6QJ1J4F6T3M0H0S1"
command = ["/usr/bin/rsync", "-a", "/src", "/dst"]
cwd = "/"
env = { FOO = "bar" }
schedule = "0 2 * * *"
timezone = "America/Los_Angeles"
timeout_ms = 600000
paused = false

[jobs.oneoff]
command = ["/usr/bin/echo", "hello"]
run_at = "2026-02-01T10:00:00Z"
timezone = "UTC"
paused = false
```

### Sync Strategy
- `jobs.toml` is the source of truth for job definitions.
- CLI RPC operations update DB and TOML in one daemon transaction.
- Daemon watches `jobs.toml` for edits and reconciles DB on change.
- Writes are atomic (write temp file + rename), with a cross-platform lock file.

## 9. Scheduling Semantics
- Cron expressions are 5-field standard (minute, hour, dom, month, dow).
- Timezone is per job (IANA name). If omitted, system local time.
- One-time jobs use ISO timestamps; Croner supports ISO-based schedules.
- Missed runs: coalesce to next schedule (no backlog replay).
- Overlap policy default: skip; if a job is still running, new run is skipped and recorded.
- Clock changes: next run time is recomputed each tick via Croner.

## 10. Process Execution
- On macOS/Linux: spawn via `Bun.spawn([$SHELL, "-lc", cmd])` using user's login shell to source shell configs and ensure user-modified PATH is available.
- On Windows: spawn via `Bun.spawn([cmd, ...args])` directly.
- `stdout` and `stderr` are set to file sinks.
- All runs are isolated OS processes; no in-process task execution.
- Timeout uses Bun spawn `timeout` option with `killSignal`.
- Stop/kill:
  - `stop`: graceful (POSIX SIGTERM, Windows CTRL_BREAK).
  - `kill`: hard (POSIX SIGKILL, Windows TerminateProcess).
- Processes are tracked via PID and awaited to prevent zombies.

## 11. Output and Logs
### Run Output Files
- Per-run files under XDG state directory:
  - `state/runs/<jobId>/<runId>.out`
  - `state/runs/<jobId>/<runId>.err`

### Event Stream
- JSONL event log at `state/events.jsonl`.
- Event types: `job_created`, `job_updated`, `job_deleted`, `job_paused`, `job_resumed`,
  `run_started`, `run_finished`, `run_skipped`, `run_failed`, `run_killed`, `daemon_started`, `daemon_stopped`.

### Daemon Logging
- Consola logger with JSON reporter in non-TTY mode.

## 12. IPC and RPC
### Transport
- Hono server bound to `127.0.0.1` with a daemon-selected port.
- Port and token stored in `state/daemon.json` with 0600 permissions.
- CLI uses `hc<AppType>(baseUrl)` for typed requests.

### Auth
- Token-based auth via `Authorization: Bearer <token>` header.
- All routes validated using `zValidator` and Zod schemas.

### Error Response Format
All API errors follow a standardized format with actionable hints:
```json
{
  "error": {
    "code": "job_not_found",
    "message": "Job \"backup\" was not found",
    "hint": "List available jobs with: crnd list",
    "details": [...]
  }
}
```

Fields:
- `code`: Machine-readable error code for programmatic handling.
- `message`: Human-readable description of what went wrong.
- `hint`: Actionable suggestion for how to fix the error.
- `details`: Array of validation issues (for validation errors only).

Error codes:
- Validation (400): `validation_error`, `confirmation_required`
- Not found (404): `job_not_found`, `run_not_found`
- Conflict (409): `run_not_running`
- Server (500): `job_not_saved`, `kill_failed`, `stop_failed`, `import_failed`
- Auth (401): `unauthorized`
- Daemon (503): `daemon_unreachable`, `daemon_start_failed`

### RPC Endpoints (summary)
- `GET /health` -> daemon status and version.
- `GET /jobs` -> list jobs (filters).
- `GET /jobs/:id` -> job details.
- `POST /jobs` -> create or upsert job.
- `PATCH /jobs/:id` -> update job fields.
- `DELETE /jobs/:id` -> delete job.
- `POST /jobs/:id/pause` -> pause job.
- `POST /jobs/:id/resume` -> resume job.
- `POST /jobs/:id/run` -> run once.
- `POST /jobs/:id/stop` -> stop running process.
- `POST /jobs/:id/kill` -> kill running process.
- `POST /jobs/:id/reset` -> reset job state.
- `GET /jobs/:id/runs` -> list runs.
- `GET /runs/:id` -> run details.
- `GET /runs/:id/logs` -> stdout/stderr paths.
- `POST /export` -> export jobs TOML.
- `POST /import` -> import jobs TOML.
- `POST /daemon/shutdown` -> stop daemon.

## 13. CLI UX
### Verb-first commands
- `crnd schedule` (create or update by name)
- `crnd list`
- `crnd show`
- `crnd update`
- `crnd delete`
- `crnd pause`
- `crnd resume`
- `crnd run-once`
- `crnd logs`
- `crnd reset`
- `crnd stop`
- `crnd kill`
- `crnd status`
- `crnd export`
- `crnd import`
- `crnd doctor`
- `crnd daemon <start|stop|status|install|uninstall>`

### Flag rules
- All flags have shorthands.
- No interactive prompts; destructive ops require `--force/-f`.
- Output defaults to human-readable text on TTY and JSON on non-TTY.
- `--json/-j` forces JSON output; `--quiet/-q` suppresses non-essential text.

### Command examples
```sh
# Schedule a cron job
crnd schedule -n backup -s "0 2 * * *" -z "America/Los_Angeles" -- /usr/bin/rsync -a /src /dst

# Schedule one-time job (absolute time)
crnd schedule -n once -a "2026-02-01T10:00:00Z" -- /usr/bin/echo hello

# Schedule one-time job (relative time)
crnd schedule -n reminder -i 5m -- /usr/bin/echo "Time's up!"
crnd schedule -n deploy -i 2h -- ./deploy.sh
crnd schedule -n quick -i 30s -- ./script.sh

# Pause and resume
crnd pause -n backup
crnd resume -n backup

# Run on demand
crnd run-once -n backup

# Read logs for latest run
crnd logs -n backup -t
```

### Relative time formats
The `-i` flag accepts relative time strings parsed by the `ms` library:
- `30s`, `30 seconds` -> 30 seconds from now
- `5m`, `5 minutes` -> 5 minutes from now
- `2h`, `2 hours` -> 2 hours from now
- `1d`, `1 day` -> 1 day from now
- `1w`, `1 week` -> 1 week from now
- `1y`, `1 year` -> 1 year from now

Relative times are converted to absolute ISO 8601 timestamps at CLI parse time before being sent to the daemon.

### Exit codes
- `0`: success
- `1`: runtime error
- `2`: validation error
- `3`: daemon unavailable

## 14. Fault Tolerance and Recovery
- Daemon startup:
  - Load DB.
  - Parse `jobs.toml` and reconcile.
  - Recompute next runs for all active jobs.
  - Check `runs` with `status=running` and validate PIDs; mark `lost` if missing.
- SQLite uses WAL for concurrent read/write access.
- File locks prevent concurrent TOML edits.

## 15. Tooling and Quality
- `biome format`, `biome lint`, `biome check` enforced in CI.
- `tsgo --noEmit` for typecheck.
- `bun test` for unit and integration tests.

## 15.1 Code Conventions
- 1 file = 1 function.
- 1 route = 1 file (Hono route per-route modules).
- 1 file under 200 lines.
- Co-location: keep helpers, constants, and types next to their usage.
- No type assertions (`as`); use type guards or schema validation.

## 16. CI/CD
- GitHub Actions on push:
  - Install dependencies.
  - Biome check.
  - tsgo typecheck.
  - bun:test (unit + integration) on Linux and macOS.
  - Build binaries with `bun build --compile` for Linux, macOS, Windows.
- Release on push with auto changelogs (release-please or equivalent conventional commits workflow).
- Artifacts include per-OS single binaries.

## 17. Security and Privacy
- Local-only RPC bound to 127.0.0.1.
- Token stored with user-only permissions.
- No outbound network calls at runtime.
- Logs and outputs remain on local disk; no telemetry.
