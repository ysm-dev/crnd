import { writeFileSync } from "node:fs";
import getJobsTomlPath from "../paths/getJobsTomlPath";
import type formatJobRow from "./formatJobRow";
import serializeJobsToml from "./serializeJobsToml";

export default function writeJobsToml(
  jobs: Array<ReturnType<typeof formatJobRow>>,
) {
  const path = getJobsTomlPath();
  const content = serializeJobsToml(jobs);
  writeFileSync(path, content, "utf-8");
}
