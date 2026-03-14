export default function getSleepCommand(durationMs = 5000) {
  return [
    process.execPath,
    "-e",
    `setTimeout(() => {}, ${Math.max(0, Math.trunc(durationMs))})`,
  ];
}
