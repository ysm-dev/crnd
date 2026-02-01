import path from "node:path";
import ensureDir from "./ensureDir";
import getPaths from "./getPaths";

export default function getStateDir() {
  const dir = path.join(getPaths().data, "state");
  return ensureDir(dir);
}
