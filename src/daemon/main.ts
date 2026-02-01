import openDatabase from "../db/openDatabase";
import migrateDatabase from "../db/migrateDatabase";
import createToken from "../shared/auth/createToken";
import writeDaemonState from "../shared/state/writeDaemonState";
import getVersion from "../shared/version";
import createLogger from "./createLogger";
import createShutdownHandler from "./createShutdownHandler";
import createJobsFileSync from "./jobs/createJobsFileSync";
import createScheduler from "./scheduler/createScheduler";
import createApp from "./server/createApp";
import startServer from "./server/startServer";
import appendEvent from "../shared/events/appendEvent";
import recoverRunningRuns from "./runner/recoverRunningRuns";

export default function startDaemon() {
  const logger = createLogger();
  const startedAt = new Date().toISOString();
  const token = createToken();
  const pid = process.pid;
  const { orm } = openDatabase();
  const migrationResult = migrateDatabase(orm);
  if (!migrationResult.migrated) {
    logger.warn({ event: "migrations_skipped", reason: migrationResult.reason });
  }
  recoverRunningRuns(orm);
  const scheduler = createScheduler(orm);
  const jobsFileSync = createJobsFileSync(orm, scheduler, logger);
  jobsFileSync.init();
  scheduler.start();
  let shutdown = () => {};
  const app = createApp(
    { token, startedAt, pid },
    orm,
    scheduler,
    jobsFileSync,
    () => shutdown()
  );
  const server = startServer(app);
  const port = server.port;
  if (typeof port !== "number") {
    throw new Error("daemon_port_unavailable");
  }

  writeDaemonState({
    port,
    token,
    pid,
    startedAt,
    version: getVersion()
  });

  appendEvent("daemon_started", { pid });

  logger.info("daemon_started");

  shutdown = createShutdownHandler(server, logger, scheduler, jobsFileSync);
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return { server, shutdown: () => shutdown() };
}
