import { existsSync, rmSync } from "node:fs";

export default function removeTempRoot(root: string) {
  if (!existsSync(root)) {
    return;
  }

  rmSync(root, {
    recursive: true,
    force: true,
    maxRetries: 20,
    retryDelay: 50,
  });
}
