import { describe, expect, test } from "bun:test";
import ensureAutostart from "../../src/daemon/autostart/ensureAutostart";

describe("ensureAutostart", () => {
  test("disabled", () => {
    const previous = process.env.CRND_DISABLE_AUTOSTART;
    process.env.CRND_DISABLE_AUTOSTART = "1";
    const result = ensureAutostart();
    expect(result.reason).toBe("disabled");
    process.env.CRND_DISABLE_AUTOSTART = previous;
  });
});
