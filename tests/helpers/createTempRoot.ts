import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export default function createTempRoot() {
  return mkdtempSync(path.join(os.tmpdir(), "crnd-test-"));
}
