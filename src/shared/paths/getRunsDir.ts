import path from "node:path";
import ensureDir from "./ensureDir";
import getStateDir from "./getStateDir";

export default function getRunsDir() {
  return ensureDir(path.join(getStateDir(), "runs"));
}
