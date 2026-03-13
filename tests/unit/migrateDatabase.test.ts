import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import migrateDatabase from "../../src/db/migrateDatabase";
import openDatabase from "../../src/db/openDatabase";
import getStateDir from "../../src/shared/paths/getStateDir";
import createTempRoot from "../helpers/createTempRoot";
import setXdgEnv from "../helpers/setXdgEnv";

function withCwd<T>(cwd: string, fn: () => T) {
  const previous = process.cwd();
  process.chdir(cwd);

  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
}

describe("migrateDatabase", () => {
  test("works outside the repository cwd", () => {
    const root = createTempRoot();
    const otherCwd = createTempRoot();
    const restore = setXdgEnv(root);

    try {
      withCwd(otherCwd, () => {
        const { orm } = openDatabase();
        const result = migrateDatabase(orm);
        expect(result.migrated).toBe(true);
      });

      const migrationsDir = path.join(getStateDir(), "drizzle");
      expect(existsSync(path.join(migrationsDir, "0000_init.sql"))).toBe(true);
      expect(
        readFileSync(
          path.join(migrationsDir, "meta", "_journal.json"),
          "utf-8",
        ),
      ).toContain('"dialect": "sqlite"');
    } finally {
      restore();
      if (existsSync(otherCwd)) {
        rmSync(otherCwd, { recursive: true, force: true });
      }
      if (existsSync(root)) {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });
});
