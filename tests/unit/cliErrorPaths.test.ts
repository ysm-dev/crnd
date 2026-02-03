import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import createTempRoot from "../helpers/createTempRoot";
import runRootCommand from "../helpers/runRootCommand";
import setXdgEnv from "../helpers/setXdgEnv";

describe("cli error paths", () => {
  let root = "";
  let restoreEnv = () => {};

  beforeAll(() => {
    root = createTempRoot();
    restoreEnv = setXdgEnv(root);
  });

  afterAll(() => {
    restoreEnv();
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // NOTE: "unreachable daemon" test removed because daemon now auto-starts.
  // Commands will automatically start the daemon if it's not running.

  test("validation errors", async () => {
    // NOTE: No need to write fake daemon state anymore since all validations
    // now happen BEFORE daemon connection (with auto-start)
    expect(
      await runRootCommand(["schedule", "-n", "job", "-s", "*/1 * * * *"]),
    ).toBe(2);
    expect(
      await runRootCommand([
        "schedule",
        "-n",
        "job",
        "-s",
        "*/1 * * * *",
        "-t",
        "bad",
        "--",
        "/bin/echo",
        "hi",
      ]),
    ).toBe(2);
    expect(
      await runRootCommand([
        "schedule",
        "-n",
        "job",
        "-s",
        "*/1 * * * *",
        "-o",
        "bad",
        "--",
        "/bin/echo",
        "hi",
      ]),
    ).toBe(2);
    expect(
      await runRootCommand([
        "schedule",
        "-n",
        "job",
        "-s",
        "*/1 * * * *",
        "-e",
        "BADENV",
        "--",
        "/bin/echo",
        "hi",
      ]),
    ).toBe(2);
    expect(await runRootCommand(["delete", "-n", "job"])).toBe(2);
    expect(await runRootCommand(["runs", "-n", "job", "-l", "bad"])).toBe(2);
    expect(await runRootCommand(["import", "-f", "missing.toml"])).toBe(2);
  });

  test("doctor without daemon", async () => {
    const code = await runRootCommand(["doctor"]);
    expect(code).toBe(1);
  });
});
