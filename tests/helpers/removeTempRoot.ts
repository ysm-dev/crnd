import { existsSync, rmSync } from "node:fs";

const RETRYABLE_CODES = new Set([
  "EBUSY",
  "EMFILE",
  "ENFILE",
  "ENOTEMPTY",
  "EPERM",
]);

function sleepSync(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export default function removeTempRoot(root: string) {
  if (!existsSync(root)) {
    return;
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true });
      return;
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as NodeJS.ErrnoException).code)
          : null;

      if (!code || !RETRYABLE_CODES.has(code)) {
        throw error;
      }

      lastError = error;
      sleepSync(100);
    }
  }

  if (lastError) {
    throw lastError;
  }
}
