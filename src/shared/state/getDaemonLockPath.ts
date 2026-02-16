import path from "node:path";
import getStateDir from "../paths/getStateDir";

export default function getDaemonLockPath() {
  return path.join(getStateDir(), "daemon.lock");
}
