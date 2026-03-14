export default function getEchoCommand(message: string) {
  return [process.execPath, "-e", `console.log(${JSON.stringify(message)})`];
}
