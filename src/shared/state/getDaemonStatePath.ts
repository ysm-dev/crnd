import path from "node:path";
import getStateDir from "../paths/getStateDir";

export default function getDaemonStatePath() {
  return path.join(getStateDir(), "daemon.json");
}
