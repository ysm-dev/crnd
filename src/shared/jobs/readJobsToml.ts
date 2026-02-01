import { existsSync, readFileSync } from "node:fs";
import getJobsTomlPath from "../paths/getJobsTomlPath";
import parseJobsToml from "./parseJobsToml";

export default function readJobsToml() {
  const path = getJobsTomlPath();
  if (!existsSync(path)) {
    return [];
  }

  const content = readFileSync(path, "utf-8");
  if (!content.trim()) {
    return [];
  }

  return parseJobsToml(content);
}
