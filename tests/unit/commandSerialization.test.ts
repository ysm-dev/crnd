import { describe, expect, test } from "bun:test";
import parseCommand from "../../src/shared/jobs/parseCommand";
import serializeCommand from "../../src/shared/jobs/serializeCommand";

describe("command serialization", () => {
  test("roundtrip", () => {
    const input = ["/bin/echo", "hello", "world"];
    const raw = serializeCommand(input);
    const parsed = parseCommand(raw);
    expect(parsed).toEqual(input);
  });
});
