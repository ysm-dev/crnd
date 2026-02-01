import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import path from "node:path";
import getStateDir from "../shared/paths/getStateDir";

export default function openDatabase() {
  const filename = path.join(getStateDir(), "crnd.db");
  const db = new Database(filename);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  return { db, orm: drizzle(db) };
}
