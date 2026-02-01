import { describe, expect, test } from "bun:test";
import getRunStatus from "../../src/daemon/runner/getRunStatus";

describe("run status", () => {
  test("success", () => {
    expect(getRunStatus(0, null)).toBe("success");
  });

  test("failed", () => {
    expect(getRunStatus(1, null)).toBe("failed");
  });

  test("killed", () => {
    expect(getRunStatus(1, "SIGKILL")).toBe("killed");
  });
});
