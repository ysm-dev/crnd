import { existsSync, readFileSync } from "node:fs";
import getUpdateCachePath from "./getUpdateCachePath";
import updateCacheSchema from "./updateCacheSchema";

export default function readUpdateCache() {
  const cachePath = getUpdateCachePath();

  if (!existsSync(cachePath)) {
    return null;
  }

  try {
    const raw = readFileSync(cachePath, "utf-8");
    const parsed = JSON.parse(raw);
    return updateCacheSchema.parse(parsed);
  } catch {
    return null;
  }
}
