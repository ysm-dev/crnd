import { runMain } from "citty";
import createRootCommand from "./commands/createRootCommand";

export default function runCli() {
  return runMain(createRootCommand());
}

runCli();
