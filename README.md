# crnd

Agent-first CLI for cron scheduling and process management.

crnd runs real OS processes on a stable per-user daemon, stores state in SQLite, and keeps a human-editable `jobs.toml` as source of truth. It is zero-config by default and compiles to a single Bun binary for Linux, macOS, and Windows.

## Install

```sh
brew install ysm-dev/crnd/crnd
```

## Why crnd
- Agent-first: non-interactive CLI, JSON output for automation.
- Local-only: no cloud, no Docker, no remote dependencies.
- Stable: separate OS process per job, zombie-safe tracking, recovery on restart.
- Hybrid storage: SQLite for state + runs, TOML for readability.
- Cross-platform: Bun single binary and OS-native autostart.

## Quickstart

Prerequisites: Bun

```sh
bun install

# Start the daemon on demand
bun run src/cli/main.ts daemon start

# Schedule a cron job (UTC, 2am daily)
bun run src/cli/main.ts schedule -n backup -s "0 2 * * *" -z "UTC" -- /usr/bin/rsync -a /src /dst

# Run once immediately
bun run src/cli/main.ts run-once -n backup

# Inspect
bun run src/cli/main.ts list
bun run src/cli/main.ts status -n backup
bun run src/cli/main.ts runs -n backup -l 5
bun run src/cli/main.ts logs -n backup -s
```

Build a single binary:

```sh
bun run build
./dist/crnd status
```

## Key features
- Verb-first CLI with shorthands.
- Cron and one-time schedules (no natural language parsing).
- Timezone-aware cron (5-field standard).
- Per-run stdout/stderr files (agent friendly).
- Pause/resume/stop/kill/reset and run history.
- Autostart install for user session (launchd, systemd user, Task Scheduler).

## Command overview

```sh
crnd schedule -n <name> -s "0 2 * * *" -z "UTC" -- /path/to/cmd arg1 arg2
crnd schedule -n <name> -a "2026-02-01T10:00:00Z" -- /path/to/cmd

crnd list
crnd show -n <name>
crnd update -n <name> ...
crnd delete -n <name> -f

crnd pause -n <name>
crnd resume -n <name>
crnd reset -n <name>

crnd run-once -n <name>
crnd stop -n <name>
crnd kill -n <name>

crnd runs -n <name> -l 20
crnd logs -n <name>
crnd logs -n <name> -s

crnd export -o jobs.toml
crnd import -f jobs.toml

crnd status
crnd status -n <name>
crnd doctor

crnd daemon start|stop|status|install|uninstall|serve
```

## jobs.toml

Location (XDG):
- macOS: `~/Library/Application Support/crnd/jobs.toml`
- Linux: `~/.config/crnd/jobs.toml`
- Windows: `%APPDATA%\crnd\jobs.toml`

Example:

```toml
[jobs.backup]
id = "01J8Z7KX2B6QJ1J4F6T3M0H0S1"
command = ["/usr/bin/rsync", "-a", "/src", "/dst"]
schedule = "0 2 * * *"
timezone = "UTC"
timeout_ms = 600000
paused = false

[jobs.oneoff]
command = ["/usr/bin/echo", "hello"]
run_at = "2026-02-01T10:00:00Z"
timezone = "UTC"
```

Editing `jobs.toml` updates the daemon automatically. The daemon also writes updates back to the file.

## Logs and events

Per-run stdout/stderr:
- `state/runs/<jobId>/<runId>.out`
- `state/runs/<jobId>/<runId>.err`

Event stream:
- `state/events.jsonl` (structured JSONL)

## Autostart

Manual install:

```sh
crnd daemon install
crnd daemon uninstall
```

crnd also attempts to install autostart on the first job creation.
To disable that behavior:

```sh
CRND_DISABLE_AUTOSTART=1 crnd schedule ...
```

## Design choices
- Separate OS process per run (safe kill/stop).
- No shell strings: commands are argv arrays only.
- SQLite for state, TOML for human edits.
- Hono RPC for end-to-end type safety.

## Project structure
- `src/cli`: CLI commands (Citty)
- `src/daemon`: daemon, scheduler, runner
- `src/db`: Drizzle schema + migrations
- `src/shared`: paths, schemas, serialization

## Development

```sh
bun run dev
bun run lint
bun run typecheck
bun test
```

Typecheck uses `tsgo` from `@typescript/native-preview`.

## CI and releases
- Biome lint/check, tsgo typecheck, and bun test on Linux + macOS.
- Release automation via release-please.

## FAQ

Q: Is this a replacement for system cron?
A: It is a user-level, local scheduler with richer control and run history.

Q: Does it run as root?
A: No, it runs as the current user and manages per-user jobs.

Q: Can I store secrets?
A: Provide env vars at schedule time; nothing is sent off machine.

## License
MIT
