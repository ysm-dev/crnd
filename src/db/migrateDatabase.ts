import { existsSync } from "node:fs";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import getMigrationsDir from "./getMigrationsDir";
import openDatabase from "./openDatabase";

type Db = ReturnType<typeof openDatabase>["orm"];

export default function migrateDatabase(db?: Db) {
  const migrationsFolder = getMigrationsDir();
  if (!existsSync(migrationsFolder)) {
    return { migrated: false, reason: "missing_migrations" };
  }

  const orm = db ?? openDatabase().orm;
  try {
    migrate(orm, { migrationsFolder });
    return { migrated: true };
  } catch {
    return { migrated: false, reason: "migration_failed" };
  }
}
