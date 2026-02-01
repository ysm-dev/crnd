import { defineCommand } from "citty";
import createDaemonServeCommand from "./createDaemonServeCommand";
import createDaemonStartCommand from "./createDaemonStartCommand";
import createDaemonStatusCommand from "./createDaemonStatusCommand";
import createDaemonStopCommand from "./createDaemonStopCommand";
import createDaemonInstallCommand from "./createDaemonInstallCommand";
import createDaemonUninstallCommand from "./createDaemonUninstallCommand";

export default function createDaemonCommand() {
  return defineCommand({
    meta: {
      name: "daemon",
      description: "Manage the crnd daemon"
    },
    subCommands: {
      start: createDaemonStartCommand(),
      stop: createDaemonStopCommand(),
      status: createDaemonStatusCommand(),
      serve: createDaemonServeCommand(),
      install: createDaemonInstallCommand(),
      uninstall: createDaemonUninstallCommand()
    }
  });
}
