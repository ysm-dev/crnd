import { gt as semverGt, valid as semverValid } from "semver";
import getVersion from "../../shared/version";
import checkLatestVersion from "./checkLatestVersion";
import performUpgrade from "./performUpgrade";
import readUpdateCache from "./readUpdateCache";
import shouldCheckForUpdate from "./shouldCheckForUpdate";
import writeUpdateCache from "./writeUpdateCache";

interface AutoUpdateResult {
  checked: boolean;
  updated: boolean;
  currentVersion: string;
  latestVersion?: string;
  error?: string;
}

function isNewerVersion(latest: string, current: string): boolean {
  // Validate both versions
  if (!semverValid(latest) || !semverValid(current)) {
    return false;
  }
  return semverGt(latest, current);
}

function isRunningViaNpxOrBunx(): boolean {
  // npx sets npm_execpath to the npx script path
  const npmExecPath = process.env.npm_execpath ?? "";
  if (npmExecPath.includes("npx")) {
    return true;
  }

  // bunx typically runs from a cache directory
  const scriptPath = process.argv[1] ?? "";
  if (
    scriptPath.includes(".bun/install/cache") ||
    scriptPath.includes("bunx")
  ) {
    return true;
  }

  return false;
}

export default async function autoUpdate(): Promise<AutoUpdateResult> {
  const currentVersion = getVersion();

  // Check if auto-update is disabled
  if (process.env.CRND_NO_AUTO_UPDATE === "1") {
    return { checked: false, updated: false, currentVersion };
  }

  // Skip if running via npx/bunx (always fetches latest anyway)
  if (isRunningViaNpxOrBunx()) {
    return { checked: false, updated: false, currentVersion };
  }

  // Check if we have a cached result that indicates an update is available
  const cache = readUpdateCache();
  let latestVersion: string | null = cache?.latestVersion ?? null;

  // Only check registry if enough time has passed
  if (shouldCheckForUpdate()) {
    latestVersion = await checkLatestVersion();

    if (latestVersion) {
      writeUpdateCache({
        lastCheck: new Date().toISOString(),
        latestVersion,
        currentVersionAtCheck: currentVersion,
      });
    }
  }

  // If we couldn't determine latest version, skip
  if (!latestVersion) {
    return { checked: true, updated: false, currentVersion };
  }

  // Check if update is available
  if (!isNewerVersion(latestVersion, currentVersion)) {
    return {
      checked: true,
      updated: false,
      currentVersion,
      latestVersion,
    };
  }

  // Update is available - perform upgrade
  console.log(`Updating crnd (${currentVersion} → ${latestVersion})...`);

  const result = await performUpgrade(latestVersion);

  if (!result.success) {
    console.log(`Update failed: ${result.error}`);
    return {
      checked: true,
      updated: false,
      currentVersion,
      latestVersion,
      error: result.error,
    };
  }

  console.log(`Updated to ${latestVersion}`);
  return {
    checked: true,
    updated: true,
    currentVersion,
    latestVersion,
  };
}
