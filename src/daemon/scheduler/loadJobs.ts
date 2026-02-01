import type openDatabase from "../../db/openDatabase";
import { jobs } from "../../db/schema";
import formatJobRow from "../../shared/jobs/formatJobRow";

type Db = ReturnType<typeof openDatabase>["orm"];

export default function loadJobs(db: Db) {
  const rows = db.select().from(jobs).all();
  return rows.map(formatJobRow);
}
