import { describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import readDaemonState from "../../src/shared/state/readDaemonState";
import removeDaemonState from "../../src/shared/state/removeDaemonState";
import writeDaemonState from "../../src/shared/state/writeDaemonState";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("daemon state", () => {
  test("write/read/remove", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    writeDaemonState({
      port: 1234,
      token: "token",
      pid: 42,
      startedAt: "2026-02-01T10:00:00Z",
      version: "0.0.0",
    });
    const state = readDaemonState();
    expect(state?.port).toBe(1234);
    removeDaemonState();
    expect(readDaemonState()).toBeNull();
    restore();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
