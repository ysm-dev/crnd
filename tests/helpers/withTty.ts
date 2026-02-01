export default async function withTty<T>(value: boolean, fn: () => Promise<T>) {
  const descriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
  Object.defineProperty(process.stdout, "isTTY", {
    value,
    configurable: true
  });
  try {
    return await fn();
  } finally {
    if (descriptor) {
      Object.defineProperty(process.stdout, "isTTY", descriptor);
    }
  }
}
