import path from "node:path";
import getJobRunsDir from "./getJobRunsDir";

export default function getRunOutputPaths(jobId: string, runId: string) {
  const dir = getJobRunsDir(jobId);
  return {
    stdoutPath: path.join(dir, `${runId}.out`),
    stderrPath: path.join(dir, `${runId}.err`)
  };
}
