import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineCommand } from "citty";
import getStateDir from "../../../shared/paths/getStateDir";
import createLaunchdPlist from "./createLaunchdPlist";
import createSystemdService from "./createSystemdService";
import getDaemonServiceArgs from "./getDaemonServiceArgs";
import quoteWindowsArg from "./quoteWindowsArg";

export default function createDaemonInstallCommand() {
  return defineCommand({
    meta: {
      name: "install",
      description: "Install auto-start service",
    },
    args: {
      json: {
        type: "boolean",
        alias: "j",
      },
    },
    run({ args }) {
      if (process.env.CRND_AUTOSTART_DRY_RUN === "1") {
        const payload = { ok: true, dryRun: true };
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify(payload));
        } else {
          console.log("daemon: install dry run");
        }
        return;
      }

      const stdoutPath = path.join(getStateDir(), "daemon.out");
      const stderrPath = path.join(getStateDir(), "daemon.err");
      const daemonArgs = getDaemonServiceArgs();
      const platform = process.platform;

      if (platform === "darwin") {
        const plistPath = path.join(
          os.homedir(),
          "Library",
          "LaunchAgents",
          "com.crnd.daemon.plist",
        );
        mkdirSync(path.dirname(plistPath), { recursive: true });
        writeFileSync(
          plistPath,
          createLaunchdPlist(daemonArgs, stdoutPath, stderrPath),
          "utf-8",
        );
        Bun.spawnSync(["launchctl", "unload", plistPath]);
        const result = Bun.spawnSync(["launchctl", "load", plistPath]);

        const ok = result.success;
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify({ ok, path: plistPath }));
        } else {
          console.log(
            ok ? `daemon: installed (${plistPath})` : "daemon: install failed",
          );
        }
        if (!ok) {
          process.exitCode = 1;
        }
        return;
      }

      if (platform === "linux") {
        const servicePath = path.join(
          os.homedir(),
          ".config",
          "systemd",
          "user",
          "crnd.service",
        );
        mkdirSync(path.dirname(servicePath), { recursive: true });
        writeFileSync(
          servicePath,
          createSystemdService(daemonArgs, stdoutPath, stderrPath),
          "utf-8",
        );
        Bun.spawnSync(["systemctl", "--user", "daemon-reload"]);
        const result = Bun.spawnSync([
          "systemctl",
          "--user",
          "enable",
          "--now",
          "crnd.service",
        ]);
        const ok = result.success;
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify({ ok, path: servicePath }));
        } else {
          console.log(
            ok
              ? `daemon: installed (${servicePath})`
              : "daemon: install failed",
          );
        }
        if (!ok) {
          process.exitCode = 1;
        }
        return;
      }

      if (platform === "win32") {
        const taskName = "crnd";
        const taskCommand = daemonArgs.map(quoteWindowsArg).join(" ");
        const result = Bun.spawnSync([
          "schtasks",
          "/Create",
          "/F",
          "/SC",
          "ONLOGON",
          "/TN",
          taskName,
          "/TR",
          taskCommand,
        ]);
        const ok = result.success;
        if (!process.stdout.isTTY || args.json) {
          console.log(JSON.stringify({ ok, task: taskName }));
        } else {
          console.log(
            ok ? `daemon: installed (${taskName})` : "daemon: install failed",
          );
        }
        if (!ok) {
          process.exitCode = 1;
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
    },
  });
}
