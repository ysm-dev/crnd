import { describe, expect, test } from "bun:test";
import getAutostartPath from "../../src/daemon/autostart/getAutostartPath";

describe("autostart path", () => {
  test("returns value", () => {
    const path = getAutostartPath();
    expect(path === null || typeof path === "string").toBe(true);
  });
});
