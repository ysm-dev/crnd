import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import createTempRoot from "../helpers/createTempRoot";
import getSleepCommand from "../helpers/getSleepCommand";
import runRootCommand from "../helpers/runRootCommand";
import setXdgEnv from "../helpers/setXdgEnv";
import createRpcClient from "../../src/shared/rpc/createRpcClient";
import withTty from "../helpers/withTty";
import openDatabase from "../../src/db/openDatabase";
import migrateDatabase from "../../src/db/migrateDatabase";
import createLogger from "../../src/daemon/createLogger";
import createJobsFileSync from "../../src/daemon/jobs/createJobsFileSync";
import createScheduler from "../../src/daemon/scheduler/createScheduler";
import createApp from "../../src/daemon/server/createApp";
import startServer from "../../src/daemon/server/startServer";
import writeDaemonState from "../../src/shared/state/writeDaemonState";
import removeDaemonState from "../../src/shared/state/removeDaemonState";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("cli commands", () => {
  let root = "";
  let restoreEnv = () => {};
  let shutdown = () => {};

  beforeAll(() => {
    root = createTempRoot();
    restoreEnv = setXdgEnv(root);
    const { orm } = openDatabase();
    migrateDatabase(orm);
    const scheduler = createScheduler(orm);
    const logger = createLogger();
    const jobsFileSync = createJobsFileSync(orm, scheduler, logger);
    jobsFileSync.init();
    scheduler.start();
    const token = "test-token";
    const app = createApp(
      {
        token,
        startedAt: new Date().toISOString(),
        pid: 1
      },
      orm,
      scheduler,
      jobsFileSync,
      () => shutdown()
    );
    const server = startServer(app);
    shutdown = () => {
      scheduler.stop();
      jobsFileSync.stop();
      server.stop();
      removeDaemonState();
    };
    if (typeof server.port !== "number") {
      throw new Error("missing port");
    }
    writeDaemonState({
      port: server.port,
      token,
      pid: 1,
      startedAt: new Date().toISOString(),
      version: "0.0.0"
    });
  });

  afterAll(async () => {
    await runRootCommand(["daemon", "stop"]);
    shutdown();
    restoreEnv();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("command success", async () => {
    await withTty(true, async () => {
      let startCode = await runRootCommand(["daemon", "start"]);
      if (startCode !== 0) {
        await wait(500);
        startCode = await runRootCommand(["daemon", "start"]);
      }
      expect(startCode).toBe(0);
      expect(await runRootCommand(["daemon", "status"])).toBe(0);

      expect(
        await runRootCommand([
          "schedule",
          "-n",
          "cron",
          "-s",
          "*/1 * * * *",
          "-z",
          "UTC",
          "-d",
          "test cron",
          "--",
          "/bin/echo",
          "hello"
        ])
      ).toBe(0);

      expect(
        await runRootCommand([
          "update",
          "-n",
          "cron",
          "-s",
          "*/2 * * * *",
          "-z",
          "UTC",
          "-d",
          "updated",
          "--",
          "/bin/echo",
          "hello"
        ])
      ).toBe(0);

      expect(await runRootCommand(["list"])).toBe(0);
      expect(await runRootCommand(["show", "-n", "cron"])).toBe(0);
      expect(await runRootCommand(["status", "-n", "cron"])).toBe(0);
      expect(await runRootCommand(["pause", "-n", "cron"])).toBe(0);
      expect(await runRootCommand(["resume", "-n", "cron"])).toBe(0);
      expect(await runRootCommand(["reset", "-n", "cron"])).toBe(0);

      expect(await runRootCommand(["run-once", "-n", "cron"])).toBe(0);
      await wait(200);
      expect(await runRootCommand(["runs", "-n", "cron", "-l", "5"])).toBe(0);
      expect(await runRootCommand(["logs", "-n", "cron"])).toBe(0);
      expect(await runRootCommand(["logs", "-n", "cron", "-s"])).toBe(0);

      const exportPath = path.join(root, "export.toml");
      expect(await runRootCommand(["export", "-o", exportPath])).toBe(0);
      expect(readFileSync(exportPath, "utf-8").length).toBeGreaterThan(0);
      expect(await runRootCommand(["import", "-f", exportPath])).toBe(0);

      const sleepCommand = getSleepCommand();
      expect(
        await runRootCommand([
          "schedule",
          "-n",
          "sleepy",
          "-s",
          "*/5 * * * *",
          "-o",
          "allow",
          "--",
          sleepCommand,
          "5"
        ])
      ).toBe(0);
      const waitForRunning = async () => {
        const client = createRpcClient();
        if (!client) {
          return false;
        }
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const res = await client.jobs[":name"].runs.$get({
            param: { name: "sleepy" },
            query: { limit: "1" }
          });
          if (res.ok) {
            const list = await res.json();
            const run = list[0];
            if (run && run.status === "running" && run.pid) {
              return true;
            }
          }
          await wait(100);
        }
        return false;
      };

      expect(await runRootCommand(["run-once", "-n", "sleepy"])).toBe(0);
      await waitForRunning();
      expect(await runRootCommand(["stop", "-n", "sleepy"])).toBe(0);
      await wait(200);
      expect(await runRootCommand(["run-once", "-n", "sleepy"])).toBe(0);
      await waitForRunning();
      expect(await runRootCommand(["kill", "-n", "sleepy"])).toBe(0);

      expect(await runRootCommand(["daemon", "install"])).toBe(0);
      expect(await runRootCommand(["daemon", "uninstall"])).toBe(0);
      // doctor returns 1 in test mode because autostart is dry-run only
      expect(await runRootCommand(["doctor"])).toBe(1);

      expect(await runRootCommand(["stop", "-n", "cron"])).toBe(1);
      expect(await runRootCommand(["kill", "-n", "cron"])).toBe(1);
      expect(await runRootCommand(["run-once", "-n", "missing"])).toBe(1);
      expect(await runRootCommand(["runs", "-n", "missing"])).toBe(1);
      expect(await runRootCommand(["logs", "-n", "missing"])).toBe(1);
      expect(await runRootCommand(["show", "-n", "missing"])).toBe(1);
      expect(await runRootCommand(["status", "-n", "missing"])).toBe(1);

      expect(await runRootCommand(["delete", "-n", "sleepy", "-f"])).toBe(0);
      expect(await runRootCommand(["delete", "-n", "cron", "-f"])).toBe(0);
      expect(await runRootCommand(["delete", "-n", "missing", "-f"])).toBe(1);

      const badImport = path.join(root, "bad.toml");
      await Bun.write(badImport, "invalid=");
      expect(await runRootCommand(["import", "-f", badImport])).toBe(1);
    });
  });
});
