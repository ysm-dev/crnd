import { Hono } from "hono";
import type openDatabase from "../../../db/openDatabase";
import { jobs } from "../../../db/schema";
import formatJobRow from "../../../shared/jobs/formatJobRow";

type Db = ReturnType<typeof openDatabase>["orm"];

export default function registerJobsListRoute(db: Db) {
  return new Hono().get("/jobs", (c) => {
    const rows = db.select().from(jobs).all();
    return c.json(rows.map(formatJobRow));
  });
}
