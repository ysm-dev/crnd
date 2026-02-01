import path from "node:path";

export default function getMigrationsDir() {
  return path.join(process.cwd(), "drizzle");
}
