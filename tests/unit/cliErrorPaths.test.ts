import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import createTempRoot from "../helpers/createTempRoot";
import runRootCommand from "../helpers/runRootCommand";
import setXdgEnv from "../helpers/setXdgEnv";
import writeDaemonState from "../../src/shared/state/writeDaemonState";

describe("cli error paths", () => {
  let root = "";
  let restoreEnv = () => {};

  beforeAll(() => {
    root = createTempRoot();
    restoreEnv = setXdgEnv(root);
  });

  afterAll(() => {
    restoreEnv();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("unreachable daemon", async () => {
    expect(await runRootCommand(["list"])).toBe(3);
    expect(await runRootCommand(["show", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["status"])).toBe(3);
    expect(await runRootCommand(["run-once", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["pause", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["resume", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["reset", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["runs", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["logs", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["stop", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["kill", "-n", "job"])).toBe(3);
    expect(await runRootCommand(["export"])).toBe(3);
  });

  test("validation errors", async () => {
    writeDaemonState({
      port: 1234,
      token: "token",
      pid: 1,
      startedAt: "2026-02-01T10:00:00Z",
      version: "0.0.0"
    });
    expect(await runRootCommand(["schedule", "-n", "job", "-s", "*/1 * * * *"])).toBe(2);
    expect(
      await runRootCommand([
        "schedule",
        "-n",
        "job",
        "-s",
        "*/1 * * * *",
        "-t",
        "bad",
        "--",
        "/bin/echo",
        "hi"
      ])
    ).toBe(2);
    expect(
      await runRootCommand([
        "schedule",
        "-n",
        "job",
        "-s",
        "*/1 * * * *",
        "-o",
        "bad",
        "--",
        "/bin/echo",
        "hi"
      ])
    ).toBe(2);
    expect(
      await runRootCommand([
        "schedule",
        "-n",
        "job",
        "-s",
        "*/1 * * * *",
        "-e",
        "BADENV",
        "--",
        "/bin/echo",
        "hi"
      ])
    ).toBe(2);
    expect(await runRootCommand(["delete", "-n", "job"])).toBe(2);
    expect(await runRootCommand(["runs", "-n", "job", "-l", "bad"])).toBe(2);
    expect(await runRootCommand(["import", "-f", "missing.toml"])).toBe(2);
  });

  test("doctor without daemon", async () => {
    const code = await runRootCommand(["doctor"]);
    expect(code).toBe(1);
  });

});
