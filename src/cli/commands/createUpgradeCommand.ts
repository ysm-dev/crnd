import { defineCommand } from "citty";
import { gt as semverGt, valid as semverValid } from "semver";
import getVersion from "../../shared/version";
import checkLatestVersion from "../update/checkLatestVersion";
import detectInstallMethod from "../update/detectInstallMethod";
import performUpgrade from "../update/performUpgrade";
import writeUpdateCache from "../update/writeUpdateCache";

export default function createUpgradeCommand() {
  return defineCommand({
    meta: {
      name: "upgrade",
      description: "Upgrade crnd to the latest version",
    },
    args: {
      check: {
        type: "boolean",
        alias: "c",
        description: "Check for updates without installing",
      },
      force: {
        type: "boolean",
        alias: "f",
        description: "Force upgrade even if already at latest version",
      },
      json: {
        type: "boolean",
        alias: "j",
        description: "Output in JSON format",
      },
    },
    async run({ args }) {
      const currentVersion = getVersion();
      const jsonOutput = !process.stdout.isTTY || args.json;

      // Always fetch latest version for explicit upgrade command
      const latestVersion = await checkLatestVersion();

      if (!latestVersion) {
        if (jsonOutput) {
          console.log(
            JSON.stringify({
              status: "error",
              error: "Could not fetch latest version from npm registry",
              currentVersion,
            }),
          );
        } else {
          console.log("Could not fetch latest version from npm registry");
        }
        process.exitCode = 1;
        return;
      }

      // Update cache with fresh data
      writeUpdateCache({
        lastCheck: new Date().toISOString(),
        latestVersion,
        currentVersionAtCheck: currentVersion,
      });

      const isNewer =
        semverValid(latestVersion) &&
        semverValid(currentVersion) &&
        semverGt(latestVersion, currentVersion);

      // Check-only mode
      if (args.check) {
        if (jsonOutput) {
          console.log(
            JSON.stringify({
              status: isNewer ? "update_available" : "up_to_date",
              currentVersion,
              latestVersion,
            }),
          );
        } else if (isNewer) {
          console.log(`Update available: ${currentVersion} → ${latestVersion}`);
          console.log("Run 'crnd upgrade' to install");
        } else {
          console.log(`Already at latest version (${currentVersion})`);
        }
        return;
      }

      // Check if update is needed
      if (!isNewer && !args.force) {
        if (jsonOutput) {
          console.log(
            JSON.stringify({
              status: "up_to_date",
              currentVersion,
              latestVersion,
            }),
          );
        } else {
          console.log(`Already at latest version (${currentVersion})`);
        }
        return;
      }

      // Detect install method
      const method = detectInstallMethod();

      if (method === "unknown") {
        if (jsonOutput) {
          console.log(
            JSON.stringify({
              status: "error",
              error: "unknown_install_method",
              currentVersion,
              latestVersion,
              hint: "Update manually: npm i -g crnd@latest, bun i -g crnd@latest, or brew upgrade crnd",
            }),
          );
        } else {
          console.log("Could not detect installation method.");
          console.log("Please update manually:");
          console.log("  npm:  npm install -g crnd@latest");
          console.log("  bun:  bun install -g crnd@latest");
          console.log("  brew: brew upgrade crnd");
        }
        process.exitCode = 1;
        return;
      }

      // Perform upgrade
      if (!jsonOutput) {
        console.log(`Upgrading crnd (${currentVersion} → ${latestVersion})...`);
        console.log(`Using: ${method}`);
      }

      const result = await performUpgrade(latestVersion);

      if (!result.success) {
        if (jsonOutput) {
          console.log(
            JSON.stringify({
              status: "error",
              error: result.error,
              method: result.method,
              currentVersion,
              latestVersion,
              daemonRestartFailed: result.daemonRestartFailed,
            }),
          );
        } else {
          console.log(`Upgrade failed: ${result.error}`);
          if (result.daemonRestartFailed) {
            console.log(
              "Warning: Failed to restart daemon. Run 'crnd daemon start' manually.",
            );
          }
        }
        process.exitCode = 1;
        return;
      }

      if (jsonOutput) {
        console.log(
          JSON.stringify({
            status: "upgraded",
            previousVersion: currentVersion,
            newVersion: latestVersion,
            method: result.method,
            daemonRestartFailed: result.daemonRestartFailed,
          }),
        );
      } else {
        console.log(`Successfully upgraded to ${latestVersion}`);
        if (result.daemonRestartFailed) {
          console.log(
            "Warning: Failed to restart daemon. Run 'crnd daemon start' manually.",
          );
        }
      }
    },
  });
}
