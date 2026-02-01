import { describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import startDaemon from "../../src/daemon/main";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("startDaemon", () => {
  test("starts and handles shutdown", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    process.env.CRND_TEST_MODE = "1";
    const runtime = startDaemon();
    expect(typeof runtime.server.port).toBe("number");
    runtime.shutdown();
    process.env.CRND_TEST_MODE = undefined;
    restore();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
