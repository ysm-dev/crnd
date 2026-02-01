import { defineCommand } from "citty";
import getVersion from "../../shared/version";
import createListCommand from "./createListCommand";
import createDeleteCommand from "./createDeleteCommand";
import createKillCommand from "./createKillCommand";
import createPauseCommand from "./createPauseCommand";
import createResumeCommand from "./createResumeCommand";
import createRunOnceCommand from "./createRunOnceCommand";
import createScheduleCommand from "./createScheduleCommand";
import createShowCommand from "./createShowCommand";
import createStatusCommand from "./createStatusCommand";
import createStopCommand from "./createStopCommand";
import createRunsCommand from "./createRunsCommand";
import createLogsCommand from "./createLogsCommand";
import createResetCommand from "./createResetCommand";
import createExportCommand from "./createExportCommand";
import createImportCommand from "./createImportCommand";
import createDoctorCommand from "./createDoctorCommand";
import createUpdateCommand from "./createUpdateCommand";
import createDaemonCommand from "./daemon/createDaemonCommand";

export default function createRootCommand() {
  return defineCommand({
    meta: {
      name: "crnd",
      version: getVersion(),
      description: "Local cron and scheduler"
    },
    subCommands: {
      schedule: createScheduleCommand(),
      update: createUpdateCommand(),
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
      daemon: createDaemonCommand()
    }
  });
}
