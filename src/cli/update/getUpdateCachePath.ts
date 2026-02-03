import path from "node:path";
import getStateDir from "../../shared/paths/getStateDir";

export default function getUpdateCachePath() {
  return path.join(getStateDir(), "update.json");
}
