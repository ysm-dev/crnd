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

  test("uses process.execPath for executable", () => {
    const originalArgv = process.argv;
    const scriptPath = path.resolve("src/cli/main.ts");
    process.argv = ["bun", scriptPath];
    const spawnArgs = getDaemonSpawnArgs();
    const serviceArgs = getDaemonServiceArgs();
    const installArgs = getDaemonInstallArgs();
    // Should use process.execPath, not process.argv[0]
    expect(spawnArgs[0]).toBe(process.execPath);
    expect(serviceArgs[0]).toBe(process.execPath);
    expect(installArgs[0]).toBe(process.execPath);
    process.argv = originalArgv;
  });

  test("uses process.execPath for compiled binary (non-.ts)", () => {
    const originalArgv = process.argv;
    // Simulate compiled binary: argv[0] is "bun", argv[1] is virtual path
    process.argv = ["bun", "/$bunfs/root/crnd", "daemon", "start"];
    const spawnArgs = getDaemonSpawnArgs();
    const serviceArgs = getDaemonServiceArgs();
    const installArgs = getDaemonInstallArgs();
    // Should use process.execPath (actual binary path), not "bun"
    expect(spawnArgs[0]).toBe(process.execPath);
    expect(serviceArgs[0]).toBe(process.execPath);
    expect(installArgs[0]).toBe(process.execPath);
    // Should have "daemon" and "serve"/"install" subcommands
    expect(spawnArgs[1]).toBe("daemon");
    expect(spawnArgs[2]).toBe("serve");
    expect(serviceArgs[1]).toBe("daemon");
    expect(serviceArgs[2]).toBe("serve");
    expect(installArgs[1]).toBe("daemon");
    expect(installArgs[2]).toBe("install");
    process.argv = originalArgv;
  });
});
