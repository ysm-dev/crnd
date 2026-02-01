import { describe, expect, test } from "bun:test";
import path from "node:path";
import getDaemonServiceArgs from "../../src/cli/commands/daemon/getDaemonServiceArgs";
import getDaemonSpawnArgs from "../../src/cli/getDaemonSpawnArgs";
import getDaemonInstallArgs from "../../src/daemon/autostart/getDaemonInstallArgs";

describe("daemon arg builders", () => {
  test("uses script path when ts file", () => {
    const originalArgv = process.argv;
    const scriptPath = path.resolve("src/cli/main.ts");
    process.argv = [originalArgv[0] ?? "bun", scriptPath];
    const spawnArgs = getDaemonSpawnArgs();
    const serviceArgs = getDaemonServiceArgs();
    const installArgs = getDaemonInstallArgs();
    expect(spawnArgs[1]).toBe(scriptPath);
    expect(serviceArgs[1]).toBe(scriptPath);
    expect(installArgs[1]).toBe(scriptPath);
    process.argv = originalArgv;
  });
});
