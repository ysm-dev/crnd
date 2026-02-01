import { existsSync, readFileSync } from "node:fs";
import createDaemonStateSchema from "./daemonStateSchema";
import getDaemonStatePath from "./getDaemonStatePath";

export default function readDaemonState() {
  const path = getDaemonStatePath();
  if (!existsSync(path)) {
    return null;
  }

  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw);
  return createDaemonStateSchema().parse(parsed);
}
