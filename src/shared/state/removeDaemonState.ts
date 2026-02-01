import { existsSync, unlinkSync } from "node:fs";
import getDaemonStatePath from "./getDaemonStatePath";

export default function removeDaemonState() {
  const path = getDaemonStatePath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}
