import { describe, expect, test } from "bun:test";
import { existsSync, rmSync, writeSync } from "node:fs";
import createRunOutputFds from "../../src/daemon/runner/createRunOutputFds";
import getRunOutputPaths from "../../src/shared/paths/getRunOutputPaths";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

describe("run output fds", () => {
  test("creates files and closes", () => {
    const root = createTempRoot();
    const restore = setXdgEnv(root);
    const { stdoutPath, stderrPath } = getRunOutputPaths("job", "run");
    const outputs = createRunOutputFds(stdoutPath, stderrPath);
    writeSync(outputs.stdoutFd, "hello");
    writeSync(outputs.stderrFd, "err");
    outputs.close();
    expect(existsSync(stdoutPath)).toBe(true);
    expect(existsSync(stderrPath)).toBe(true);
    restore();
    rmSync(root, { recursive: true, force: true });
  });
});
