import { Hono } from "hono";
import type openDatabase from "../../../db/openDatabase";
import { jobs } from "../../../db/schema";
import formatJobRow from "../../../shared/jobs/formatJobRow";
import serializeJobsToml from "../../../shared/jobs/serializeJobsToml";
import type createJobsFileSync from "../../jobs/createJobsFileSync";

type Db = ReturnType<typeof openDatabase>["orm"];
type JobsFileSync = ReturnType<typeof createJobsFileSync>;

export default function registerExportRoute(db: Db, jobsFileSync: JobsFileSync) {
  return new Hono().post("/export", (c) => {
    const rows = db.select().from(jobs).all().map(formatJobRow);
    jobsFileSync.writeFromDb();
    const toml = serializeJobsToml(rows);
    return c.json({ toml });
  });
}
