import { writeFileSync } from "node:fs";
import type { DaemonState } from "./daemonStateSchema";
import getDaemonStatePath from "./getDaemonStatePath";

export default function writeDaemonState(state: DaemonState) {
  const path = getDaemonStatePath();
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
}
