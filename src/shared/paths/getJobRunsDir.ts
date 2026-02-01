import path from "node:path";
import ensureDir from "./ensureDir";
import getRunsDir from "./getRunsDir";

export default function getJobRunsDir(jobId: string) {
  return ensureDir(path.join(getRunsDir(), jobId));
}
