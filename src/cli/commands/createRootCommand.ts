import { defineCommand } from "citty";
import getVersion from "../../shared/version";
import createDeleteCommand from "./createDeleteCommand";
import createDoctorCommand from "./createDoctorCommand";
import createExportCommand from "./createExportCommand";
import createImportCommand from "./createImportCommand";
import createKillCommand from "./createKillCommand";
import createListCommand from "./createListCommand";
import createLogsCommand from "./createLogsCommand";
import createPauseCommand from "./createPauseCommand";
import createResetCommand from "./createResetCommand";
import createResumeCommand from "./createResumeCommand";
import createRunOnceCommand from "./createRunOnceCommand";
import createRunsCommand from "./createRunsCommand";
import createScheduleCommand from "./createScheduleCommand";
import createShowCommand from "./createShowCommand";
import createStatusCommand from "./createStatusCommand";
import createStopCommand from "./createStopCommand";
import createUpdateCommand from "./createUpdateCommand";
import createUpgradeCommand from "./createUpgradeCommand";
import createDaemonCommand from "./daemon/createDaemonCommand";

export default function createRootCommand() {
  return defineCommand({
    meta: {
      name: "crnd",
      version: getVersion(),
      description: "Local cron and scheduler",
    },
    subCommands: {
      schedule: createScheduleCommand(),
      update: createUpdateCommand(),
      upgrade: createUpgradeCommand(),
      list: createListCommand(),
      show: createShowCommand(),
      runs: createRunsCommand(),
      logs: createLogsCommand(),
      delete: createDeleteCommand(),
      pause: createPauseCommand(),
      resume: createResumeCommand(),
      reset: createResetCommand(),
      stop: createStopCommand(),
      kill: createKillCommand(),
      export: createExportCommand(),
      import: createImportCommand(),
      doctor: createDoctorCommand(),
      "run-once": createRunOnceCommand(),
      status: createStatusCommand(),
      daemon: createDaemonCommand(),
    },
  });
}
