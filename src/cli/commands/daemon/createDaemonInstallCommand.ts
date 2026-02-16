import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineCommand } from "citty";
import getStateDir from "../../../shared/paths/getStateDir";
import readDaemonState from "../../../shared/state/readDaemonState";
import createLaunchdPlist from "./createLaunchdPlist";
import createSystemdService from "./createSystemdService";
import getDaemonServiceArgs from "./getDaemonServiceArgs";
import quoteWindowsArg from "./quoteWindowsArg";

function isDaemonRunningFromState() {
  try {
    const state = readDaemonState();
    if (!state) {
      return false;
    }

    process.kill(state.pid, 0);
    return true;
  } catch {
    return false;
  }
}

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
        description: "Output in JSON format",
      },
      noStart: {
        type: "boolean",
        description: "Install service without starting now",
      },
    },
    run({ args }) {
      if (process.env.CRND_AUTOSTART_DRY_RUN === "1") {
        const payload = { ok: true, dryRun: true };
        if (args.json) {
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
      const supportedPlatforms = ["darwin", "linux", "win32"];
      const daemonRunning = isDaemonRunningFromState();
      const shouldStartNow = !args.noStart && !daemonRunning;

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
        const result = shouldStartNow
          ? (() => {
              Bun.spawnSync(["launchctl", "unload", plistPath]);
              return Bun.spawnSync(["launchctl", "load", plistPath]);
            })()
          : { success: true };

        const ok = result.success;
        if (args.json) {
          console.log(
            JSON.stringify({
              ok,
              path: plistPath,
              started: shouldStartNow,
            }),
          );
        } else {
          if (ok) {
            const deferred = shouldStartNow ? "" : " (start deferred)";
            console.log(`daemon: installed (${plistPath})${deferred}`);
          } else {
            console.log("daemon: install failed");
          }
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
        const result = Bun.spawnSync(
          shouldStartNow
            ? ["systemctl", "--user", "enable", "--now", "crnd.service"]
            : ["systemctl", "--user", "enable", "crnd.service"],
        );
        const ok = result.success;
        if (args.json) {
          console.log(
            JSON.stringify({
              ok,
              path: servicePath,
              started: shouldStartNow,
            }),
          );
        } else {
          if (ok) {
            const deferred = shouldStartNow ? "" : " (start deferred)";
            console.log(`daemon: installed (${servicePath})${deferred}`);
          } else {
            console.log("daemon: install failed");
          }
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
        if (args.json) {
          console.log(JSON.stringify({ ok, task: taskName, started: false }));
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

      const supportedList = supportedPlatforms.join(", ");
      const message = `daemon install: autostart service is not supported on ${platform}`;
      const hint = `Supported platforms: ${supportedList}. Start manually with: crnd daemon start`;
      const payload = {
        ok: false,
        error: "unsupported_platform",
        message,
        hint,
        platform,
        supportedPlatforms,
      };
      if (args.json) {
        console.log(JSON.stringify(payload));
      } else {
        console.log(message);
        console.log(`  ${hint}`);
      }
      process.exitCode = 1;
    },
  });
}
