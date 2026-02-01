type EnvSnapshot = {
  XDG_DATA_HOME?: string;
  XDG_CONFIG_HOME?: string;
  CRND_DISABLE_AUTOSTART?: string;
  CRND_AUTOSTART_DRY_RUN?: string;
  CRND_PATHS_ROOT?: string;
};

export default function setXdgEnv(root: string) {
  const snapshot: EnvSnapshot = {
    XDG_DATA_HOME: process.env.XDG_DATA_HOME,
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
    CRND_DISABLE_AUTOSTART: process.env.CRND_DISABLE_AUTOSTART,
    CRND_AUTOSTART_DRY_RUN: process.env.CRND_AUTOSTART_DRY_RUN,
    CRND_PATHS_ROOT: process.env.CRND_PATHS_ROOT,
  };

  process.env.XDG_DATA_HOME = root;
  process.env.XDG_CONFIG_HOME = root;
  process.env.CRND_DISABLE_AUTOSTART = "1";
  process.env.CRND_AUTOSTART_DRY_RUN = "1";
  process.env.CRND_PATHS_ROOT = root;

  return () => {
    process.env.XDG_DATA_HOME = snapshot.XDG_DATA_HOME;
    process.env.XDG_CONFIG_HOME = snapshot.XDG_CONFIG_HOME;
    process.env.CRND_DISABLE_AUTOSTART = snapshot.CRND_DISABLE_AUTOSTART;
    process.env.CRND_AUTOSTART_DRY_RUN = snapshot.CRND_AUTOSTART_DRY_RUN;
    process.env.CRND_PATHS_ROOT = snapshot.CRND_PATHS_ROOT;
  };
}
