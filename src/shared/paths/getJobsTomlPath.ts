import path from "node:path";
import getConfigDir from "./getConfigDir";

export default function getJobsTomlPath() {
  return path.join(getConfigDir(), "jobs.toml");
}
