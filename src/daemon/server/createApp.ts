import { Hono } from "hono";
import { z } from "zod";
import type openDatabase from "../../db/openDatabase";
import type createJobsFileSync from "../jobs/createJobsFileSync";
import type createScheduler from "../scheduler/createScheduler";
import getVersion from "../../shared/version";
import createAuthMiddleware from "./createAuthMiddleware";
import registerHealthRoute from "./routes/registerHealthRoute";
import registerShutdownRoute from "./routes/registerShutdownRoute";
import registerJobsDeleteRoute from "./routes/registerJobsDeleteRoute";
import registerJobsGetRoute from "./routes/registerJobsGetRoute";
import registerJobsListRoute from "./routes/registerJobsListRoute";
import registerJobRunsRoute from "./routes/registerJobRunsRoute";
import registerJobsPauseRoute from "./routes/registerJobsPauseRoute";
import registerJobsResumeRoute from "./routes/registerJobsResumeRoute";
import registerJobsKillRoute from "./routes/registerJobsKillRoute";
import registerJobsStopRoute from "./routes/registerJobsStopRoute";
import registerJobsResetRoute from "./routes/registerJobsResetRoute";
import registerExportRoute from "./routes/registerExportRoute";
import registerImportRoute from "./routes/registerImportRoute";
import registerRunGetRoute from "./routes/registerRunGetRoute";
import registerRunLogsRoute from "./routes/registerRunLogsRoute";
import registerJobsUpsertRoute from "./routes/registerJobsUpsertRoute";
import registerJobsRunRoute from "./routes/registerJobsRunRoute";

const createAppOptionsSchema = z.object({
  token: z.string().min(1),
  startedAt: z.string().datetime(),
  pid: z.number().int().positive()
});

type CreateAppOptions = z.infer<typeof createAppOptionsSchema>;
type Db = ReturnType<typeof openDatabase>["orm"];
type Scheduler = ReturnType<typeof createScheduler>;
type JobsFileSync = ReturnType<typeof createJobsFileSync>;

export default function createApp(
  options: CreateAppOptions,
  db: Db,
  scheduler: Scheduler,
  jobsFileSync: JobsFileSync,
  shutdown: () => void
) {
  const parsed = createAppOptionsSchema.parse(options);
  const app = new Hono()
    .use("*", createAuthMiddleware(parsed.token))
    .route(
      "/",
      registerHealthRoute({
        status: "ok",
        startedAt: parsed.startedAt,
        pid: parsed.pid,
        version: getVersion()
      })
    )
    .route("/", registerShutdownRoute(shutdown))
    .route("/", registerJobsGetRoute(db))
    .route("/", registerJobsListRoute(db))
    .route("/", registerJobRunsRoute(db))
    .route("/", registerJobsUpsertRoute(db, scheduler, jobsFileSync))
    .route("/", registerJobsRunRoute(db, scheduler))
    .route("/", registerJobsPauseRoute(db, scheduler, jobsFileSync))
    .route("/", registerJobsResumeRoute(db, scheduler, jobsFileSync))
    .route("/", registerJobsResetRoute(db, scheduler, jobsFileSync))
    .route("/", registerJobsStopRoute(db))
    .route("/", registerJobsKillRoute(db))
    .route("/", registerJobsDeleteRoute(db, scheduler, jobsFileSync))
    .route("/", registerExportRoute(db, jobsFileSync))
    .route("/", registerImportRoute(jobsFileSync))
    .route("/", registerRunGetRoute(db))
    .route("/", registerRunLogsRoute(db));

  return app;
}

export type AppType = ReturnType<typeof createApp>;
