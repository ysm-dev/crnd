export default function quoteWindowsArg(value: string) {
  const escaped = value.replaceAll("\"", "\\\"");
  return `"${escaped}"`;
}
