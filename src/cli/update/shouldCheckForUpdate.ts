import readUpdateCache from "./readUpdateCache";

const DEFAULT_CHECK_INTERVAL_SECS = 86400; // 24 hours

function getCheckIntervalMs(): number {
  const envValue = process.env.CRND_AUTO_UPDATE_SECS;
  if (envValue) {
    const parsed = Number.parseInt(envValue, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed * 1000;
    }
  }
  return DEFAULT_CHECK_INTERVAL_SECS * 1000;
}

export default function shouldCheckForUpdate(): boolean {
  // Check if auto-update is disabled
  if (process.env.CRND_NO_AUTO_UPDATE === "1") {
    return false;
  }

  const cache = readUpdateCache();
  if (!cache) {
    return true;
  }

  const lastCheck = new Date(cache.lastCheck).getTime();
  const now = Date.now();
  const intervalMs = getCheckIntervalMs();

  return now - lastCheck >= intervalMs;
}
