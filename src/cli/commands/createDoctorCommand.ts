import { accessSync, constants, existsSync } from "node:fs";
import { defineCommand } from "citty";
import getAutostartPath from "../../daemon/autostart/getAutostartPath";
import getJobsTomlPath from "../../shared/paths/getJobsTomlPath";
import createRpcClient from "../../shared/rpc/createRpcClient";

export default function createDoctorCommand() {
  return defineCommand({
    meta: {
      name: "doctor",
      description: "Check crnd health",
    },
    args: {
      json: {
        type: "boolean",
        alias: "j",
      },
    },
    async run({ args }) {
      const results: Array<{ check: string; ok: boolean; detail?: string }> =
        [];
      const client = createRpcClient();

      if (!client) {
        results.push({ check: "daemon", ok: false, detail: "unreachable" });
      } else {
        try {
          const res = await client.health.$get();
          results.push({
            check: "daemon",
            ok: res.ok,
            detail: res.ok ? "running" : `status ${res.status}`,
          });
        } catch {
          results.push({ check: "daemon", ok: false, detail: "unreachable" });
        }
      }

      const jobsToml = getJobsTomlPath();
      if (!existsSync(jobsToml)) {
        results.push({ check: "jobs.toml", ok: false, detail: "missing" });
      } else {
        try {
          accessSync(jobsToml, constants.R_OK | constants.W_OK);
          results.push({ check: "jobs.toml", ok: true });
        } catch {
          results.push({
            check: "jobs.toml",
            ok: false,
            detail: "not_readable",
          });
        }
      }

      const autostartPath = getAutostartPath();
      const platform = process.platform;
      const supportedPlatforms = ["darwin", "linux", "win32"];
      if (process.env.CRND_AUTOSTART_DRY_RUN === "1") {
        // In dry-run mode, report autostart as not installed since install was skipped
        results.push({ check: "autostart", ok: false, detail: "dry_run" });
      } else if (!autostartPath) {
        const supportedList = supportedPlatforms.join(", ");
        results.push({
          check: "autostart",
          ok: false,
          detail: `unsupported on ${platform}; supported: ${supportedList}; start manually with: crnd daemon start`,
        });
      } else if (platform === "win32") {
        const result = Bun.spawnSync([
          "schtasks",
          "/Query",
          "/TN",
          autostartPath,
        ]);
        results.push({
          check: "autostart",
          ok: result.success,
          detail: "task",
        });
      } else {
        results.push({
          check: "autostart",
          ok: existsSync(autostartPath),
          detail: autostartPath,
        });
      }

      const ok = results.every((item) => item.ok);
      if (args.json) {
        console.log(JSON.stringify({ ok, results }));
      } else {
        for (const item of results) {
          const detail = item.detail ? ` (${item.detail})` : "";
          console.log(`${item.check}: ${item.ok ? "ok" : "fail"}${detail}`);
        }
      }

      if (!ok) {
        process.exitCode = 1;
      }
    },
  });
}
