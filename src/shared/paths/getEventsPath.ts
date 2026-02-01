import path from "node:path";
import getStateDir from "./getStateDir";

export default function getEventsPath() {
  return path.join(getStateDir(), "events.jsonl");
}
