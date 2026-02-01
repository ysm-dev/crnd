import { describe, expect, test } from "bun:test";
import parseEnv from "../../src/shared/jobs/parseEnv";
import serializeEnv from "../../src/shared/jobs/serializeEnv";

describe("env serialization", () => {
  test("roundtrip", () => {
    const input = { FOO: "bar", HELLO: "world" };
    const raw = serializeEnv(input);
    const parsed = parseEnv(raw);
    expect(parsed).toEqual(input);
  });

  test("null input", () => {
    expect(parseEnv(null)).toBeNull();
  });
});
