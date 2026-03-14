import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import getStateDir from "../shared/paths/getStateDir";
import { EMBEDDED_MIGRATIONS } from "./embeddedMigrations";

export default function getMigrationsDir() {
  const dir = path.join(getStateDir(), "drizzle");

  for (const [relativePath, content] of Object.entries(EMBEDDED_MIGRATIONS)) {
    const filePath = path.join(dir, relativePath);
    mkdirSync(path.dirname(filePath), { recursive: true });

    try {
      if (readFileSync(filePath, "utf-8") === content) {
        continue;
      }
    } catch {}

    writeFileSync(filePath, content, "utf-8");
  }

  return dir;
}
