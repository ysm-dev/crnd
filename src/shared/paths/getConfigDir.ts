import ensureDir from "./ensureDir";
import getPaths from "./getPaths";

export default function getConfigDir() {
  return ensureDir(getPaths().config);
}
