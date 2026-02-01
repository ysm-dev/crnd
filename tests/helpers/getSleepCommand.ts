import { existsSync } from "node:fs";

export default function getSleepCommand() {
  if (existsSync("/bin/sleep")) {
    return "/bin/sleep";
  }
  if (existsSync("/usr/bin/sleep")) {
    return "/usr/bin/sleep";
  }
  return "sleep";
}
