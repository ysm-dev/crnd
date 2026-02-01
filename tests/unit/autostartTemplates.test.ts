import { describe, expect, test } from "bun:test";
import createLaunchdPlist from "../../src/cli/commands/daemon/createLaunchdPlist";
import createSystemdService from "../../src/cli/commands/daemon/createSystemdService";
import escapeXml from "../../src/cli/commands/daemon/escapeXml";
import quoteWindowsArg from "../../src/cli/commands/daemon/quoteWindowsArg";

describe("autostart templates", () => {
  test("escape xml", () => {
    expect(escapeXml("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&apos;");
  });

  test("quote windows args", () => {
    expect(quoteWindowsArg("hello world")).toBe("\"hello world\"");
    expect(quoteWindowsArg("a\"b")).toBe("\"a\\\"b\"");
  });

  test("launchd plist", () => {
    const plist = createLaunchdPlist(["/bin/echo", "hi"], "/tmp/out", "/tmp/err");
    expect(plist.includes("ProgramArguments")).toBe(true);
    expect(plist.includes("/bin/echo")).toBe(true);
  });

  test("systemd service", () => {
    const service = createSystemdService(["/bin/echo", "hi"], "/tmp/out", "/tmp/err");
    expect(service.includes("ExecStart=/bin/echo hi")).toBe(true);
    expect(service.includes("StandardOutput=append:/tmp/out")).toBe(true);
  });
});
