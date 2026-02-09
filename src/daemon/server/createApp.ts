import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import type openDatabase from "../../db/openDatabase";
import getVersion from "../../shared/version";
import type createJobsFileSync from "../jobs/createJobsFileSync";
import type createScheduler from "../scheduler/createScheduler";
import createAuthMiddleware from "./createAuthMiddleware";
import createErrorHandler from "./createErrorHandler";
import registerExportRoute from "./routes/registerExportRoute";
import registerHealthRoute from "./routes/registerHealthRoute";
import registerImportRoute from "./routes/registerImportRoute";
import registerJobRunsRoute from "./routes/registerJobRunsRoute";
import registerJobsDeleteRoute from "./routes/registerJobsDeleteRoute";
import registerJobsGetRoute from "./routes/registerJobsGetRoute";
import registerJobsKillRoute from "./routes/registerJobsKillRoute";
import registerJobsListRoute from "./routes/registerJobsListRoute";
import registerJobsPauseRoute from "./routes/registerJobsPauseRoute";
import registerJobsResetRoute from "./routes/registerJobsResetRoute";
import registerJobsResumeRoute from "./routes/registerJobsResumeRoute";
import registerJobsRunRoute from "./routes/registerJobsRunRoute";
import registerJobsStopRoute from "./routes/registerJobsStopRoute";
import registerJobsUpsertRoute from "./routes/registerJobsUpsertRoute";
import registerRunGetRoute from "./routes/registerRunGetRoute";
import registerRunLogsRoute from "./routes/registerRunLogsRoute";
import registerShutdownRoute from "./routes/registerShutdownRoute";

const createAppOptionsSchema = z.object({
  token: z.string().min(1),
  startedAt: z.string().datetime(),
  pid: z.number().int().positive(),
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
  shutdown: () => void,
  logger?: { error: (data: Record<string, unknown>) => void },
) {
  const parsed = createAppOptionsSchema.parse(options);
  const app = new Hono()
    .onError(createErrorHandler(logger))
    .use("*", cors())
    .use("*", createAuthMiddleware(parsed.token))
    .route(
      "/",
      registerHealthRoute({
        status: "ok",
        startedAt: parsed.startedAt,
        pid: parsed.pid,
        version: getVersion(),
      }),
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
