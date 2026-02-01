import envPaths from "env-paths";

export default function getPaths() {
  const root = process.env.CRND_PATHS_ROOT;
  if (root) {
    return {
      data: root,
      config: root,
      cache: root,
      log: root,
      temp: root
    };
  }

  return envPaths("crnd");
}
