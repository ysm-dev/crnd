import { defineCommand } from "citty";
import startDaemon from "../../../daemon/main";

export default function createDaemonServeCommand() {
  return defineCommand({
    meta: {
      name: "serve",
      description: "Run the daemon in the foreground",
    },
    run() {
      const runtime = startDaemon();
      if (!runtime) {
        console.log("daemon: already running");
      }
    },
  });
}
