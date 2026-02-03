# crnd

*Pronounced "crowned"* — Cron daemon built for agents. JSON output, no prompts, real OS processes.

## Install

```sh
# global install
bun i -g crnd
npm i -g crnd

# or run directly
bunx crnd
npx crnd

# or homebrew
brew install ysm-dev/crnd/crnd
```

## Agent Skill

Install the crnd skill for your coding agent (Claude Code, Cursor, Codex, etc.):

```sh
npx skills add ysm-dev/crnd
```

This teaches your agent how to schedule and manage cron jobs using crnd.

## 30 seconds to your first job

```sh
# start daemon (happens automatically, but let's be explicit)
crnd daemon start

# schedule a backup at 2am UTC daily
crnd schedule -n backup -s "0 2 * * *" -- rsync -a ~/docs ~/backup

# schedule a one-time job in 5 minutes
crnd schedule -n reminder -i 5m -- say "Time to stretch!"

# run it now
crnd run-once -n backup

# check status
crnd status -n backup
```

That's it. Job definitions live in `~/.config/crnd/jobs.toml` - edit it directly and the daemon picks up changes.

## Why crnd

Most cron tools are built for humans clicking around. crnd is built for scripts and agents that need to:

- Schedule jobs without interactive prompts
- Parse structured output (`crnd list --json`)
- Stream logs from running processes
- Kill/stop jobs by name
- Trust that jobs run as real OS processes (not some container abstraction)

Everything runs locally. No cloud, no Docker, no account, no network calls.

## Commands

```sh
crnd schedule -n NAME -s "CRON" -- command args   # create/update job
crnd schedule -n NAME -a "ISO_TIMESTAMP" -- cmd   # one-time job (absolute)
crnd schedule -n NAME -i "5m" -- cmd              # one-time job (relative)
crnd list                                         # all jobs
crnd status -n NAME                               # job details
crnd runs -n NAME                                 # run history
crnd logs -n NAME -s                              # stream stdout/stderr
crnd run-once -n NAME                             # trigger now
crnd pause -n NAME                                # pause scheduling
crnd resume -n NAME                               # resume
crnd stop -n NAME                                 # graceful stop (SIGTERM)
crnd kill -n NAME                                 # hard kill (SIGKILL)
crnd delete -n NAME -f                            # remove job
crnd export                                       # dump jobs.toml
crnd import -f jobs.toml                          # load jobs
crnd daemon install                               # autostart on login
crnd doctor                                       # check setup
```

All commands support `--json` for machine-readable output.

## jobs.toml

```toml
[jobs.backup]
command = ["rsync", "-a", "/src", "/dst"]
schedule = "0 2 * * *"
timezone = "UTC"
timeout_ms = 600000

[jobs.deploy]
command = ["./deploy.sh"]
run_at = "2026-02-01T10:00:00Z"
```

Edit this file directly. The daemon watches it and syncs automatically.

**Paths:**
- macOS: `~/Library/Application Support/crnd/`
- Linux: `~/.config/crnd/`
- Windows: `%APPDATA%\crnd\`

## How it works

- Each job spawns a real OS process via `Bun.spawn`
- State lives in SQLite, job definitions in TOML
- Daemon runs per-user, binds to `127.0.0.1`
- Autostart via launchd (macOS), systemd user (Linux), or Task Scheduler (Windows)
- Stdout/stderr saved per-run in `state/runs/<jobId>/<runId>.out|.err`

## Development

```sh
bun install
bun run dev          # start daemon in dev mode
bun run build        # compile single binary
bun test
```

## License

MIT
