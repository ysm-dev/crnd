import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import getDaemonLockPath from "../../shared/state/getDaemonLockPath";

type DaemonLock = {
  release: () => void;
};

export type AcquireDaemonLockResult =
  | {
      ok: true;
      lock: DaemonLock;
    }
  | {
      ok: false;
      ownerPid: number | null;
    };

function isPidAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readOwnerPid(lockPath: string) {
  try {
    const raw = readFileSync(lockPath, "utf-8").trim();
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { pid?: unknown };
    if (typeof parsed.pid === "number" && Number.isInteger(parsed.pid)) {
      return parsed.pid > 0 ? parsed.pid : null;
    }
  } catch {
    return null;
  }

  return null;
}

function removeLockFile(lockPath: string) {
  if (!existsSync(lockPath)) {
    return;
  }

  try {
    unlinkSync(lockPath);
  } catch {}
}

function tryAcquireLock(lockPath: string): AcquireDaemonLockResult {
  const fd = openSync(lockPath, "wx", 0o600);
  try {
    writeFileSync(
      fd,
      `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`,
      "utf-8",
    );
  } catch (error) {
    try {
      closeSync(fd);
    } catch {}
    removeLockFile(lockPath);
    throw error;
  }

  let released = false;
  const release = () => {
    if (released) {
      return;
    }
    released = true;
    try {
      closeSync(fd);
    } catch {}
    removeLockFile(lockPath);
  };

  return {
    ok: true,
    lock: { release },
  };
}

function isAlreadyExistsError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "EEXIST"
  );
}

export default function acquireDaemonLock(): AcquireDaemonLockResult {
  const lockPath = getDaemonLockPath();

  try {
    return tryAcquireLock(lockPath);
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  const ownerPid = readOwnerPid(lockPath);
  const shouldRecoverStaleLock = ownerPid === null || !isPidAlive(ownerPid);

  if (shouldRecoverStaleLock) {
    removeLockFile(lockPath);
    try {
      return tryAcquireLock(lockPath);
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }
      return {
        ok: false,
        ownerPid: readOwnerPid(lockPath),
      };
    }
  }

  return {
    ok: false,
    ownerPid,
  };
}
