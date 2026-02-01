import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import createRpcClient from "../../src/shared/rpc/createRpcClient";
import writeDaemonState from "../../src/shared/state/writeDaemonState";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("rpc client", () => {
  test("returns client when state present", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    writeDaemonState({
      port: 1234,
      token: "token",
      pid: 42,
      startedAt: "2026-02-01T10:00:00Z",
      version: "0.0.0",
    });
    const client = createRpcClient();
    expect(client).toBeTruthy();
    restore();
    rmSync(root, { recursive: true, force: true });
  });
});
