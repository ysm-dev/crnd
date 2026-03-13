import { describe, expect, test } from "bun:test";
import { writeFileSync } from "node:fs";
import startDaemon from "../../src/daemon/main";
import getDaemonLockPath from "../../src/shared/state/getDaemonLockPath";
import createTempRoot from "../helpers/createTempRoot";
import removeTempRoot from "../helpers/removeTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("startDaemon", () => {
  function withDaemonTest(fn: () => void) {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    process.env.CRND_TEST_MODE = "1";

    try {
      fn();
    } finally {
      process.env.CRND_TEST_MODE = undefined;
      restore();
      removeTempRoot(root);
    }
  }

  test("starts and handles shutdown", () => {
    withDaemonTest(() => {
      const runtime = startDaemon();
      expect(runtime).not.toBeNull();
      expect(typeof runtime?.server.port).toBe("number");
      runtime?.shutdown();
    });
  });

  test("prevents duplicate daemon instances", () => {
    withDaemonTest(() => {
      const runtime = startDaemon();
      expect(runtime).not.toBeNull();

      const duplicate = startDaemon();
      expect(duplicate).toBeNull();

      runtime?.shutdown();
    });
  });

  test("recovers from a stale lock file", () => {
    withDaemonTest(() => {
      const lockPath = getDaemonLockPath();
      writeFileSync(
        lockPath,
        `${JSON.stringify({ pid: 99999999, startedAt: new Date().toISOString() })}\n`,
        "utf-8",
      );

      const runtime = startDaemon();
      expect(runtime).not.toBeNull();
      runtime?.shutdown();
    });
  });
});
