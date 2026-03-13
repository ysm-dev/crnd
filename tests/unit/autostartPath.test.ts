import { describe, expect, test } from "bun:test";
import getAutostartPath from "../../src/daemon/autostart/getAutostartPath";

function withPlatform<T>(platform: NodeJS.Platform, fn: () => T) {
  const descriptor = Object.getOwnPropertyDescriptor(process, "platform");
  Object.defineProperty(process, "platform", {
    value: platform,
    configurable: true,
  });

  try {
    return fn();
  } finally {
    if (descriptor) {
      Object.defineProperty(process, "platform", descriptor);
    }
  }
}

describe("autostart path", () => {
  test("returns linux path from XDG config home", () => {
    const previous = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = "/tmp/crnd-xdg";

    const autostartPath = withPlatform("linux", () => getAutostartPath());
    expect(autostartPath).toBe("/tmp/crnd-xdg/systemd/user/crnd.service");

    process.env.XDG_CONFIG_HOME = previous;
  });

  test("returns windows task name", () => {
    expect(withPlatform("win32", () => getAutostartPath())).toBe("crnd");
  });
});
