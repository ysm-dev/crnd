import { existsSync, unlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineCommand } from "citty";

export default function createDaemonUninstallCommand() {
  return defineCommand({
    meta: {
      name: "uninstall",
      description: "Remove auto-start service"
    },
    args: {
      json: {
        type: "boolean",
        alias: "j"
      }
    },
    run({ args }) {
      if (process.env.CRND_AUTOSTART_DRY_RUN === "1") {
        const payload = { ok: true, dryRun: true };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: uninstall dry run");
        }
        return;
      }

      const platform = process.platform;

      if (platform === "darwin") {
        const plistPath = path.join(
          os.homedir(),
          "Library",
          "LaunchAgents",
          "com.crnd.daemon.plist"
        );
        Bun.spawnSync(["launchctl", "unload", plistPath]);
        if (existsSync(plistPath)) {
          unlinkSync(plistPath);
        }

        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify({ ok: true, path: plistPath }));
        } else {
          console.log(`daemon: uninstalled (${plistPath})`);
        }
        return;
      }

      if (platform === "linux") {
        const servicePath = path.join(
          os.homedir(),
          ".config",
          "systemd",
          "user",
          "crnd.service"
        );
        Bun.spawnSync(["systemctl", "--user", "disable", "--now", "crnd.service"]);
        Bun.spawnSync(["systemctl", "--user", "daemon-reload"]);
        if (existsSync(servicePath)) {
          unlinkSync(servicePath);
        }

        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify({ ok: true, path: servicePath }));
        } else {
          console.log(`daemon: uninstalled (${servicePath})`);
        }
        return;
      }

      if (platform === "win32") {
        const taskName = "crnd";
        Bun.spawnSync(["schtasks", "/Delete", "/TN", taskName, "/F"]);
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify({ ok: true, task: taskName }));
        } else {
          console.log(`daemon: uninstalled (${taskName})`);
        }
        return;
      }

      const payload = { ok: false, error: "unsupported_platform" };
      if (!process.stdout.isTTY || args.json) {
        console.log(JSON.stringify(payload));
      } else {
        console.log("daemon: unsupported platform");
      }
      process.exitCode = 1;
    }
  });
}
