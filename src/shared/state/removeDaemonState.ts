import { existsSync, unlinkSync } from "node:fs";
import getDaemonStatePath from "./getDaemonStatePath";
import readDaemonState from "./readDaemonState";

export default function removeDaemonState(expectedPid?: number) {
  const path = getDaemonStatePath();
  if (existsSync(path)) {
    if (typeof expectedPid === "number") {
      try {
        const state = readDaemonState();
        if (state && state.pid !== expectedPid) {
          return;
        }
      } catch {}
    }

    unlinkSync(path);
  }
}
