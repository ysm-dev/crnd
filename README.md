# crnd

*Pronounced "crowned"*

[![npm version](https://img.shields.io/npm/v/crnd)](https://www.npmjs.com/package/crnd)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![macOS](https://img.shields.io/badge/macOS-supported-brightgreen)
![Linux](https://img.shields.io/badge/Linux-supported-brightgreen)
![Windows](https://img.shields.io/badge/Windows-supported-brightgreen)

**Cron daemon built for agents.** No interactive prompts. Structured output. Real OS processes. Runs entirely local.

AI coding agents (Claude Code, Cursor, Codex) can't use `crontab` — it requires interactive editing and produces unstructured output. crnd gives them a cron daemon they can actually drive.

## Why crnd

Most cron tools are built for humans clicking around. crnd is built for scripts and agents that need to:

- Schedule jobs **without interactive prompts**
- Parse structured output (`crnd list --json`)
- Stream logs from running processes
- Kill/stop jobs by name
- Trust that jobs run as **real OS processes** (not some container abstraction)

Everything runs locally. No cloud, no Docker, no account, no network calls.

### crnd vs the alternatives

| | crnd | crontab | launchd | systemd timers |
|---|---|---|---|---|
| Agent-friendly (no interactive UI) | Yes | No (requires `EDITOR`) | No (XML plist) | Partially |
| Structured JSON output | Yes (`--json`) | No | No | `journalctl --output=json` |
| One-time scheduled tasks | Yes (`-i 5m`, `-a ISO`) | No | Yes | Yes |
| Per-job timezone | Yes | No | No | Yes |
| Cross-platform | macOS, Linux, Windows | Linux/macOS | macOS only | Linux only |
| Run history & logs | Built-in | No | Console.app | journalctl |
| Job management (pause/resume/stop) | Yes | No | launchctl | systemctl |
| Zero config install | `npx crnd` | Pre-installed | Pre-installed | Pre-installed |
| Skill system for AI agents | Yes | No | No | No |

### Platform support

| Platform | Architecture | Status |
|---|---|---|
| macOS | Apple Silicon (arm64) | Supported |
| macOS | Intel (x64) | Supported |
| Linux | x64 | Supported |
| Linux | arm64 | Supported |
| Linux | x64 musl | Supported |
| Linux | arm64 musl | Supported |
| Windows | x64 | Supported |

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

That's it. Job definitions live in `~/.config/crnd/jobs.toml` — edit it directly and the daemon picks up changes.

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
crnd upgrade                                      # update to latest version
crnd upgrade --check                              # check for updates
```

All commands default to text output; use `--json` for machine-readable output.

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
- Auto-updates like Homebrew (checks every 24hrs, updates before commands)

## Auto-Update

crnd checks for updates automatically (like Homebrew). To disable:

```sh
export CRND_NO_AUTO_UPDATE=1
```

Or configure the check interval (default 24 hours):

```sh
export CRND_AUTO_UPDATE_SECS=3600  # check every hour
```

Manual update:

```sh
crnd upgrade              # update now
crnd upgrade --check      # just check, don't update
```

## Built with

- [Bun](https://bun.sh) — runtime, bundler, test runner, single-binary compiler
- [TypeScript](https://www.typescriptlang.org) — type-safe codebase
- [Hono](https://hono.dev) — daemon HTTP/RPC server
- [Drizzle](https://orm.drizzle.team) + SQLite — state & run history
- [Croner](https://github.com/hexagon/croner) — timezone-aware cron parsing
- [Zod](https://zod.dev) — input validation
- [Biome](https://biomejs.dev) — lint & format

## Development

```sh
bun install
bun run dev          # start daemon in dev mode
bun run build        # compile single binary
bun test
```

## License

MIT
