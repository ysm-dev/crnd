import { describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { Hono } from "hono";
import createLogger from "../../src/daemon/createLogger";
import createShutdownHandler from "../../src/daemon/createShutdownHandler";
import createJobsFileSync from "../../src/daemon/jobs/createJobsFileSync";
import createScheduler from "../../src/daemon/scheduler/createScheduler";
import startServer from "../../src/daemon/server/startServer";
import openDatabase from "../../src/db/openDatabase";
import migrateDatabase from "../../src/db/migrateDatabase";
import getDaemonStatePath from "../../src/shared/state/getDaemonStatePath";
import writeDaemonState from "../../src/shared/state/writeDaemonState";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("shutdown handler", () => {
  test("stops and removes state", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    const { orm } = openDatabase();
    migrateDatabase(orm);
    const logger = createLogger();
    const scheduler = createScheduler(orm);
    const jobsFileSync = createJobsFileSync(orm, scheduler, logger);
    const server = startServer(new Hono().get("/health", (c) => c.text("ok")));
    writeDaemonState({
      port: Number(server.port) || 1,
      token: "token",
      pid: 1,
      startedAt: new Date().toISOString(),
      version: "0.0.0"
    });

    const exitCalls: number[] = [];
    const originalExit = process.exit;
    const exitFn: typeof process.exit = (code?: number) => {
      exitCalls.push(code ?? 0);
      throw new Error("exit");
    };
    process.exit = exitFn;

    const shutdown = createShutdownHandler(server, logger, scheduler, jobsFileSync);
    try {
      shutdown();
    } catch {
    } finally {
      process.exit = originalExit;
    }

    expect(exitCalls.length).toBe(1);
    expect(existsSync(getDaemonStatePath())).toBe(false);
    restore();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
