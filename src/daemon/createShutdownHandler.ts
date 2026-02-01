import appendEvent from "../shared/events/appendEvent";
import removeDaemonState from "../shared/state/removeDaemonState";
import type createLogger from "./createLogger";
import type createJobsFileSync from "./jobs/createJobsFileSync";
import type createScheduler from "./scheduler/createScheduler";

type Logger = ReturnType<typeof createLogger>;
type Server = ReturnType<typeof Bun.serve>;
type Scheduler = ReturnType<typeof createScheduler>;
type JobsFileSync = ReturnType<typeof createJobsFileSync>;

export default function createShutdownHandler(
  server: Server,
  logger: Logger,
  scheduler: Scheduler,
  jobsFileSync: JobsFileSync,
) {
  return () => {
    logger.info("daemon_shutdown");
    scheduler.stop();
    jobsFileSync.stop();
    appendEvent("daemon_stopped", { pid: process.pid });
    removeDaemonState();
    server.stop();
    if (process.env.CRND_TEST_MODE !== "1") {
      process.exit(0);
    }
  };
}
