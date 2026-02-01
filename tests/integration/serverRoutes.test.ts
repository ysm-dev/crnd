import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Hono } from "hono";
import createLogger from "../../src/daemon/createLogger";
import createJobsFileSync from "../../src/daemon/jobs/createJobsFileSync";
import createScheduler from "../../src/daemon/scheduler/createScheduler";
import createApp from "../../src/daemon/server/createApp";
import migrateDatabase from "../../src/db/migrateDatabase";
import openDatabase from "../../src/db/openDatabase";
import createTempRoot from "../helpers/createTempRoot";
import getSleepCommand from "../helpers/getSleepCommand";
import setXdgEnv from "../helpers/setXdgEnv";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("daemon routes", () => {
  let app: Hono;
  let shutdownCalls = 0;
  let scheduler: ReturnType<typeof createScheduler> | null = null;
  let jobsFileSync: ReturnType<typeof createJobsFileSync> | null = null;
  let restoreEnv = () => {};
  const token = "test-token";

  beforeAll(() => {
    const root = createTempRoot();
    restoreEnv = setXdgEnv(root);
    const logger = createLogger();
    const { orm } = openDatabase();
    migrateDatabase(orm);
    scheduler = createScheduler(orm);
    jobsFileSync = createJobsFileSync(orm, scheduler, logger);
    jobsFileSync.init();
    scheduler.start();
    app = createApp(
      {
        token,
        startedAt: new Date().toISOString(),
        pid: 1,
      },
      orm,
      scheduler,
      jobsFileSync,
      () => {
        shutdownCalls += 1;
      },
    );
  });

  afterAll(() => {
    scheduler?.stop();
    jobsFileSync?.stop();
    restoreEnv();
  });

  const request = (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return app.fetch(
      new Request(`http://localhost${url}`, { ...init, headers }),
    );
  };

  const waitForRunning = async (name: string) => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const res = await request(`/jobs/${name}/runs?limit=1`);
      if (res.ok) {
        const list = (await res.json()) as Array<{
          status: string;
          pid: number;
        }>;
        const run = list[0];
        if (run && run.status === "running" && run.pid) {
          return true;
        }
      }
      await wait(100);
    }
    return false;
  };

  test("routes", async () => {
    const unauth = await app.fetch(new Request("http://localhost/health"));
    expect(unauth.status).toBe(401);

    const health = await request("/health");
    expect(health.status).toBe(200);

    const jobPayload = {
      name: "job",
      command: ["/bin/echo", "hello"],
      schedule: "*/1 * * * *",
      timezone: "UTC",
    };

    const created = await request("/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(jobPayload),
    });
    expect(created.status).toBe(200);

    const list = await request("/jobs");
    expect(list.status).toBe(200);

    const get = await request("/jobs/job");
    expect(get.status).toBe(200);

    const pause = await request("/jobs/job/pause", { method: "POST" });
    expect(pause.status).toBe(200);

    const resume = await request("/jobs/job/resume", { method: "POST" });
    expect(resume.status).toBe(200);

    const reset = await request("/jobs/job/reset", { method: "POST" });
    expect(reset.status).toBe(200);

    const runOnce = await request("/jobs/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "job" }),
    });
    expect(runOnce.status).toBe(200);

    await wait(100);
    const runs = await request("/jobs/job/runs?limit=5");
    expect(runs.status).toBe(200);
    const runList = (await runs.json()) as Array<{ id: string }>;
    const runIdValue = runList[0]?.id;
    if (typeof runIdValue !== "string") {
      throw new Error("missing run id");
    }
    const runId = runIdValue;

    const runGet = await request(`/runs/${runId}`);
    expect(runGet.status).toBe(200);

    const runLogs = await request(`/runs/${runId}/logs`);
    expect(runLogs.status).toBe(200);

    const sleepCommand = getSleepCommand();
    const sleepyPayload = {
      name: "sleepy",
      command: [sleepCommand, "5"],
      schedule: "*/5 * * * *",
      overlapPolicy: "allow",
    };

    await request("/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sleepyPayload),
    });

    await request("/jobs/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "sleepy" }),
    });
    await waitForRunning("sleepy");
    const stop = await request("/jobs/sleepy/stop", { method: "POST" });
    expect(stop.status).toBe(200);

    await request("/jobs/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "sleepy" }),
    });
    await waitForRunning("sleepy");
    const kill = await request("/jobs/sleepy/kill", { method: "POST" });
    expect(kill.status).toBe(200);

    const exported = await request("/export", { method: "POST" });
    const exportJson = (await exported.json()) as { toml: string };
    expect(typeof exportJson.toml).toBe("string");

    const imported = await request("/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ toml: exportJson.toml }),
    });
    expect(imported.status).toBe(200);

    const deleted = await request("/jobs/sleepy", { method: "DELETE" });
    expect(deleted.status).toBe(200);

    const shutdown = await request("/daemon/shutdown", { method: "POST" });
    expect(shutdown.status).toBe(200);
    await wait(20);
    expect(shutdownCalls).toBeGreaterThan(0);
  });
});
