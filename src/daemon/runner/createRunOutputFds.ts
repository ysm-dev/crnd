import { closeSync, openSync } from "node:fs";

export default function createRunOutputFds(stdoutPath: string, stderrPath: string) {
  const stdoutFd = openSync(stdoutPath, "a");
  const stderrFd = openSync(stderrPath, "a");

  return {
    stdoutFd,
    stderrFd,
    close() {
      closeSync(stdoutFd);
      closeSync(stderrFd);
    }
  };
}
