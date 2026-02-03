import { writeFileSync } from "node:fs";
import getUpdateCachePath from "./getUpdateCachePath";
import type { UpdateCache } from "./updateCacheSchema";

export default function writeUpdateCache(cache: UpdateCache): boolean {
  try {
    const cachePath = getUpdateCachePath();
    writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf-8");
    return true;
  } catch {
    // Silently fail - update cache is not critical
    return false;
  }
}
