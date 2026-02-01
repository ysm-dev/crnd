import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import type openDatabase from "../../db/openDatabase";
import { jobs, runs } from "../../db/schema";
import appendEvent from "../../shared/events/appendEvent";
import type formatJobRow from "../../shared/jobs/formatJobRow";
import getRunOutputPaths from "../../shared/paths/getRunOutputPaths";
import createRunOutputFds from "./createRunOutputFds";
import escapeShellArg from "./escapeShellArg";
import getRunStatus from "./getRunStatus";

type Db = ReturnType<typeof openDatabase>["orm"];
type Job = ReturnType<typeof formatJobRow>;

export default function runJob(db: Db, job: Job) {
  const runId = ulid();
  const startedAt = new Date().toISOString();
  const { stdoutPath, stderrPath } = getRunOutputPaths(job.id, runId);
  const outputs = createRunOutputFds(stdoutPath, stderrPath);

  db.insert(runs)
    .values({
      id: runId,
      jobId: job.id,
      status: "running",
      startedAt,
      stdoutPath,
      stderrPath,
    })
    .run();

  appendEvent("run_started", { jobId: job.id, runId });

  db.update(jobs)
    .set({ lastRunAt: startedAt, updatedAt: startedAt })
    .where(eq(jobs.id, job.id))
    .run();

  const env = job.env ? { ...process.env, ...job.env } : process.env;

  // On macOS/Linux, spawn via login shell to source shell configs (.bash_profile, .zshrc, etc.)
  // This ensures executables in user-modified PATH are available
  // Uses $SHELL to respect user's preferred shell (bash, zsh, etc.)
  // On Windows, spawn directly since PATH is usually available globally
  const shell = process.env.SHELL || "/bin/bash";
  const spawnCommand =
    process.platform === "win32"
      ? job.command
      : [shell, "-lc", job.command.map(escapeShellArg).join(" ")];

  try {
    const proc = Bun.spawn(spawnCommand, {
      cwd: job.cwd ?? undefined,
      env,
      stdout: outputs.stdoutFd,
      stderr: outputs.stderrFd,
      timeout: job.timeoutMs ?? undefined,
      killSignal: "SIGKILL",
      onExit: (_proc, exitCode, signalCode, error) => {
        outputs.close();

        const signal = signalCode ? String(signalCode) : null;
        const status = getRunStatus(exitCode ?? null, signal);

        const endedAt = new Date().toISOString();

        db.update(runs)
          .set({
            status,
            exitCode: exitCode ?? null,
            signal,
            endedAt,
            errorMessage: error ? error.message : null,
          })
          .where(eq(runs.id, runId))
          .run();

        const eventType =
          status === "killed"
            ? "run_killed"
            : status === "failed"
              ? "run_failed"
              : "run_finished";
        appendEvent(eventType, { jobId: job.id, runId, status });
      },
    });

    db.update(runs).set({ pid: proc.pid }).where(eq(runs.id, runId)).run();

    return { runId, exited: proc.exited };
  } catch (error) {
    outputs.close();

    const endedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : "spawn_failed";
    db.update(runs)
      .set({ status: "failed", endedAt, errorMessage: message })
      .where(eq(runs.id, runId))
      .run();

    appendEvent("run_failed", { jobId: job.id, runId, status: "failed" });

    return { runId, exited: Promise.resolve(1) };
  }
}
