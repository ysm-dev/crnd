import { describe, expect, test } from "bun:test";
import parseEnvArgs from "../../src/cli/commands/parseEnvArgs";

describe("parseEnvArgs", () => {
  test("parses single entry", () => {
    const env = parseEnvArgs("FOO=bar");
    expect(env?.FOO).toBe("bar");
  });

  test("parses multiple entries", () => {
    const env = parseEnvArgs(["A=1", "B=2"]);
    expect(env?.A).toBe("1");
    expect(env?.B).toBe("2");
  });

  test("throws on invalid entry", () => {
    expect(() => parseEnvArgs("BAD")).toThrow();
  });
});
