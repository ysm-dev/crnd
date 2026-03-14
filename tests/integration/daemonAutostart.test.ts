import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import createTempRoot from "../helpers/createTempRoot";
import getEchoCommand from "../helpers/getEchoCommand";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const scriptPath = path.resolve("src/cli/main.ts");

function createCliEnv(root: string) {
  return {
    ...process.env,
    XDG_DATA_HOME: root,
    XDG_CONFIG_HOME: root,
    CRND_DISABLE_AUTOSTART: "1",
    CRND_AUTOSTART_DRY_RUN: "1",
    CRND_NO_AUTO_UPDATE: "1",
    CRND_PATHS_ROOT: root,
  };
}

function runCli(root: string, args: string[]) {
  const proc = Bun.spawnSync([process.execPath, scriptPath, ...args], {
    env: createCliEnv(root),
    stderr: "pipe",
    stdout: "pipe",
  });

  return {
    code: proc.exitCode ?? (proc.success ? 0 : 1),
    stderr: new TextDecoder().decode(proc.stderr),
    stdout: new TextDecoder().decode(proc.stdout),
  };
}

describe("daemon autostart", () => {
  const root = createTempRoot();

  afterAll(async () => {
    runCli(root, ["daemon", "stop"]);
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("schedule starts the daemon automatically", async () => {
    const scheduled = runCli(root, [
      "schedule",
      "-n",
      "echo-hi",
      "-s",
      "*/5 * * * *",
      "--",
      ...getEchoCommand("hi"),
    ]);
    expect(scheduled.code, scheduled.stdout || scheduled.stderr).toBe(0);

    const listed = runCli(root, ["list"]);
    expect(listed.code, listed.stdout || listed.stderr).toBe(0);

    const status = runCli(root, ["status", "-n", "echo-hi"]);
    expect(status.code, status.stdout || status.stderr).toBe(0);

    const runOnce = runCli(root, ["run-once", "-n", "echo-hi"]);
    expect(runOnce.code, runOnce.stdout || runOnce.stderr).toBe(0);

    await wait(200);

    const runs = runCli(root, ["runs", "-n", "echo-hi", "-l", "1"]);
    expect(runs.code, runs.stdout || runs.stderr).toBe(0);
  });
});
