export default function getRunStatus(
  exitCode: number | null,
  signal: string | null,
) {
  if (signal) {
    return "killed";
  }

  if (exitCode === 0) {
    return "success";
  }

  return "failed";
}
