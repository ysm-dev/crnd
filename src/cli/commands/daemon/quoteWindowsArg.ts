export default function quoteWindowsArg(value: string) {
  if (value.length === 0) {
    return '""';
  }

  if (!/[\s"]/u.test(value)) {
    return value;
  }

  let quoted = '"';
  let backslashes = 0;

  for (const char of value) {
    if (char === "\\") {
      backslashes += 1;
      continue;
    }

    if (char === '"') {
      quoted += "\\".repeat(backslashes * 2 + 1);
      quoted += '"';
      backslashes = 0;
      continue;
    }

    if (backslashes > 0) {
      quoted += "\\".repeat(backslashes);
      backslashes = 0;
    }

    quoted += char;
  }

  if (backslashes > 0) {
    quoted += "\\".repeat(backslashes * 2);
  }

  quoted += '"';
  return quoted;
}
