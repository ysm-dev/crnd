import { mkdirSync } from "node:fs";

export default function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
  return path;
}
